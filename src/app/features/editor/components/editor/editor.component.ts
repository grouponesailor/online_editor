import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { Editor, Extension, RawCommands, ChainedCommands, CommandProps, Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import { common, createLowlight } from 'lowlight'
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { ActivatedRoute } from '@angular/router';
import { EditorView } from 'prosemirror-view';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import { Shape } from '../../../../extensions/shape';
import { Signature } from '../../../../extensions/signature';
import { NetworkConfigService } from '../../../../core/services/network-config.service';
import { ShareService } from '../../../../core/services/share.service';
import { FileService } from '../../../file/services/file.service';
import { Subject, takeUntil, debounceTime, fromEvent } from 'rxjs';
import { Subscription } from 'rxjs';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
    };
    lineHeight: {
      setLineHeight: (height: string) => ReturnType;
    };
  }
}

const FontSize = Mark.create({
  name: 'fontSize',
  
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: element => {
          // Get font size from style attribute
          const fontSize = element.style.fontSize;
          return fontSize ? fontSize : null;
        },
        renderHTML: attributes => {
          if (!attributes['size']) {
            return {}
          }
          return {
            style: `font-size: ${attributes['size']}`,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        style: 'font-size',
        getAttrs: (element) => {
          const fontSize = (element as HTMLElement).style.fontSize;
          return fontSize ? { size: fontSize } : false;
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addCommands() {
    return {
      setFontSize: (size: string) => ({ commands }) => {
        return commands.setMark(this.name, { size })
      },
    }
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: '1.5',
            parseHTML: element => element.style.lineHeight,
            renderHTML: attributes => {
              if (!attributes['lineHeight']) {
                return {}
              }
              return {
                style: `line-height: ${attributes['lineHeight']}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (height: string) => ({ commands }) => {
        return commands.updateAttributes('paragraph', { lineHeight: height })
      },
    }
  },
});

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editorElement') private editorElement!: ElementRef;
  @ViewChildren('editorElement') editorElements!: QueryList<ElementRef>;
  
  editor: Editor | null = null;
  documentId: string = '';
  documentName: string = 'Untitled Document';
  networkStatus: 'offline' | 'on-premise' | 'online' = 'offline';
  networkConfig: any = null;
  hasOfflineChanges = false;
  showShareDialog = false;
  lastSaved: Date | null = null;
  collaborators: any[] = [];
  pages: number[] = [0];
  currentPage: number = 0;
  currentZoom: number = 1;
  
  // Document statistics
  wordCount: number = 0;
  charCount: number = 0;
  paragraphCount: number = 0;
  
  private destroy$ = new Subject<void>();
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private lowlight = createLowlight(common);
  private userColor: string;
  private saveDebouncer = new Subject<void>();
  private nameChangeDebouncer = new Subject<string>();
  private resizeObserver: ResizeObserver | null = null;
  private contentChangeSubscription: Subscription | null = null;

  // Flexible margin ruler state
  leftMargin: number = 15; // mm
  rightMargin: number = 15; // mm
  rulerWidth: number = 210; // mm (A4 width)
  dragging: 'left' | 'right' | null = null;

  get leftMarginPx() { return this.leftMargin * 3.78; } // 1mm ≈ 3.78px
  get rightMarginPx() { return this.rightMargin * 3.78; }

  constructor(
    private route: ActivatedRoute,
    private networkConfigService: NetworkConfigService,
    private shareService: ShareService,
    private fileService: FileService
  ) {
    // Initialize Yjs document
    this.ydoc = new Y.Doc();
    
    // Get document ID from route
    this.documentId = this.route.snapshot.params['id'] || 'default';
    
    // Load document name
    this.loadDocumentName();
    
    // Generate a random color for the user's cursor
    this.userColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;

    // Setup auto-save for offline mode
    this.saveDebouncer.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.networkStatus === 'offline') {
        this.saveOffline();
      }
    });

    // Setup document name change debouncer
    this.nameChangeDebouncer.pipe(
      debounceTime(1000),
      takeUntil(this.destroy$)
    ).subscribe((newName: string) => {
      this.updateDocumentNameInFileManager(newName);
    });
  }

  ngOnInit() {
    // Subscribe to network status changes
    this.networkConfigService.config$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config: any) => {
        this.networkConfig = config;
        this.networkStatus = config.status;
        this.setupCollaboration();
      });

    // Subscribe to share service network status
    this.shareService.getNetworkStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: 'offline' | 'on-premise' | 'online') => {
        if ((status === 'on-premise' || status === 'online') && this.hasOfflineChanges) {
          // Automatically sync when coming back online
          this.syncOfflineChanges();
        }
      });

    this.initializeEditor();
    this.setupPageManagement();
  }

  ngAfterViewInit() {
    // Defer editor initialization to the next event loop cycle
    // This prevents ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.initializeEditor();
    }, 0);

    this.setupResizeObserver();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.editor?.destroy();
    this.ydoc.destroy();
    this.provider?.destroy();
    this.resizeObserver?.disconnect();
    this.contentChangeSubscription?.unsubscribe();
  }

  private loadDocumentName() {
    // Load from localStorage first
    const savedName = localStorage.getItem(`doc-name-${this.documentId}`);
    if (savedName) {
      this.documentName = savedName;
    }
    
    // Try to load from server if connected to on-premise or online server
    if (this.networkStatus === 'on-premise' || this.networkStatus === 'online') {
      const url = `/api/documents/${this.documentId}`;
      fetch(url)
        .then(response => response.json())
        .then(data => {
          if (data.name) {
            this.documentName = data.name;
            localStorage.setItem(`doc-name-${this.documentId}`, this.documentName);
          }
        })
        .catch(() => {
          // Ignore errors, use default name
        });
    }
  }

  saveDocumentName() {
    if (this.documentName.trim()) {
      localStorage.setItem(`doc-name-${this.documentId}`, this.documentName);
      
      // Trigger debounced update to File Manager
      this.nameChangeDebouncer.next(this.documentName);
      
      if (this.networkStatus === 'on-premise' || this.networkStatus === 'online') {
        const url = `/api/documents/${this.documentId}`;
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.documentName })
        }).catch(console.error);
      }
    }
  }

  private updateDocumentNameInFileManager(newName: string) {
    // Update the document name in the File Manager list
    this.fileService.updateDocumentName(this.documentId, newName).subscribe(
      (success: boolean) => {
        if (success) {
          console.log('Document name updated in File Manager');
        }
      },
      (error: any) => {
        console.error('Failed to update document name in File Manager:', error);
      }
    );
  }

  onDocumentNameChange(newName: string) {
    this.documentName = newName;
    this.saveDocumentName();
  }

  openShareDialog() {
    this.showShareDialog = true;
  }

  refreshConnection() {
    // Refresh network configuration
    this.networkConfigService.refresh();
    
    // Reinitialize collaboration
    this.setupCollaboration();
  }

  getNetworkStatusText(): string {
    switch (this.networkStatus) {
      case 'on-premise':
        return 'On-premise';
      case 'online':
        return 'Online';
      default:
        return 'Offline';
    }
  }

  getNetworkIcon(): string {
    switch (this.networkStatus) {
      case 'on-premise':
        return 'material-icons text-blue-500';
      case 'online':
        return 'material-icons text-green-500';
      default:
        return 'material-icons text-red-500';
    }
  }

  private setupCollaboration() {
    if (this.networkStatus === 'on-premise' || this.networkStatus === 'online') {
      this.setupServerCollaboration();
    } else {
      this.setupOfflineMode();
    }
  }

  private setupServerCollaboration() {
    if (this.provider) {
      this.provider.destroy();
    }

    try {
      const wsUrl = this.networkConfigService.getWebSocketUrl(this.documentId);
      if (wsUrl) {
        // Create a new WebSocket connection
        const serverUrl = wsUrl.replace(`/document-${this.documentId}`, '').replace('ws://', '').replace('wss://', '');
        
        this.provider = new WebsocketProvider(
          serverUrl,
          `document-${this.documentId}`,
          this.ydoc
        );

        this.provider.on('status', (event: any) => {
          console.log('WebSocket status:', event.status);
          if (event.status === 'connected') {
            console.log('Successfully connected to collaboration server');
            this.lastSaved = new Date();
          } else if (event.status === 'disconnected') {
            console.log('Disconnected from collaboration server');
            this.fallbackToOffline();
          }
        });

        this.provider.on('connection-error', (error: any) => {
          console.error('WebSocket connection error:', error);
          this.fallbackToOffline();
        });

        // Track collaborators
        if (this.provider.awareness) {
          // Set user info for this client
          this.provider.awareness.setLocalStateField('user', {
            name: 'Anonymous User',
            color: this.userColor,
          });

          this.provider.awareness.on('change', () => {
            const clients = Array.from(this.provider!.awareness!.getStates().values());
            this.collaborators = clients.filter((client: any) => client.user);
          });
        }
      }
    } catch (error) {
      console.error('Failed to setup collaboration:', error);
      this.fallbackToOffline();
    }
  }

  private setupOfflineMode() {
    // Load document from offline storage
    this.loadOfflineDocument();
  }

  private fallbackToOffline() {
    console.log('Falling back to offline mode');
    this.networkStatus = 'offline';
    this.setupOfflineMode();
  }

  private initializeEditor() {
    if (!this.editorElement?.nativeElement) {
      console.warn('Editor element not found, waiting for view initialization');
      return;
    }

    const extensions = [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Shape.configure({
        HTMLAttributes: {
          class: 'shape-container'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'table'
        }
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list'
        }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg'
        },
        allowBase64: true
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CodeBlockLowlight.configure({
        lowlight: this.lowlight,
        defaultLanguage: 'javascript',
      }),
      FontFamily.configure({
        types: ['textStyle']
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      Subscript,
      Superscript,
      Underline,
      FontSize,
      LineHeight,
      Signature.configure({
        HTMLAttributes: {
          class: 'signature-block',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline'
        }
      }),
    ];

    // Add collaboration extensions only if connected to server
    if ((this.networkStatus === 'on-premise' || this.networkStatus === 'online') && this.provider) {
      extensions.push(
        Collaboration.configure({
          document: this.ydoc,
        }),
        CollaborationCursor.configure({
          provider: this.provider,
          user: {
            name: 'Anonymous User',
            color: this.userColor,
          },
        })
      );
    }

    console.log('Initializing editor with extensions:', extensions);

    this.editor = new Editor({
      element: this.editorElement.nativeElement,
      extensions,
      editorProps: {
        attributes: {
          class: 'a4-editor tiptap prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none',
        },
        handleDOMEvents: {
          drop: (view, event) => {
            const hasFiles = event.dataTransfer?.files?.length;
            
            if (!hasFiles) {
              return false;
            }

            event.preventDefault();

            const images = Array.from(event.dataTransfer.files).filter(file => 
              file.type.startsWith('image/')
            );

            if (images.length === 0) {
              return true;
            }

            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });

            images.forEach(image => {
              const reader = new FileReader();
              reader.onload = readerEvent => {
                const node = view.state.schema.nodes['image'].create({
                  src: readerEvent.target?.result
                });
                const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
                view.dispatch(transaction);
              };
              reader.readAsDataURL(image);
            });

            return true;
          },
          paste: (view, event) => {
            const hasFiles = event.clipboardData?.files?.length;
            
            if (!hasFiles) {
              return false;
            }

            const images = Array.from(event.clipboardData.files).filter(file => 
              file.type.startsWith('image/')
            );

            if (images.length === 0) {
              return false;
            }

            event.preventDefault();

            images.forEach(image => {
              const reader = new FileReader();
              reader.onload = readerEvent => {
                const node = view.state.schema.nodes['image'].create({
                  src: readerEvent.target?.result
                });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              };
              reader.readAsDataURL(image);
            });

            return true;
          }
        },
        handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
          // Handle tab key
          if (event.key === 'Tab') {
            // If in a table cell, move to next cell
            if (this.editor?.isActive('tableCell')) {
              return false; // Let TipTap handle table navigation
            }
            
            // Check if we're in a list (bullet, ordered, or task list)
            if (this.editor?.isActive('bulletList') || this.editor?.isActive('orderedList') || this.editor?.isActive('taskList')) {
              if (event.shiftKey) {
                // Shift+Tab: Lift (outdent) list item
                this.editor.chain().focus().liftListItem('listItem').run();
              } else {
                // Tab: Sink (indent) list item to create nested list
                this.editor.chain().focus().sinkListItem('listItem').run();
              }
              return true; // Prevent default tab behavior
            }
            
            // Otherwise insert spaces for indentation
            this.editor?.chain()
              .insertContent('    ') // 4 spaces for indentation
              .run();
            
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor }) => {
        // Trigger auto-save for offline mode
        if (this.networkStatus === 'offline') {
          this.hasOfflineChanges = true;
          this.saveDebouncer.next();
        } else {
          this.lastSaved = new Date();
        }
        
        // Update document statistics
        this.updateDocumentStats();
        
        // Check content height and add new pages if needed
        this.checkPageBreaks();
        
        // Auto-detect and fix RTL text direction for better cursor positioning
        this.handleRTLTextDirection();
      }
    });

    // Handle image selection for editing
    this.editor.on('selectionUpdate', ({ editor }) => {
      const { state } = editor;
      const { from, to } = state.selection;
      
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'image') {
          // Show image edit dialog
          // You would typically emit an event or use a service to show the dialog
        }
      });
    });

    // Load initial content
    if (this.networkStatus === 'on-premise' || this.networkStatus === 'online') {
      // Wait a moment for the provider to connect
      setTimeout(() => {
        this.loadOfflineDocument();
      }, 1000);
    } else {
      this.loadOfflineDocument();
    }
  }

  private loadOfflineDocument() {
    // Load document content from localStorage or other offline storage
    const offlineKey = `document-${this.documentId}-offline`;
    const offlineContent = localStorage.getItem(offlineKey);
    
    if (offlineContent && this.editor) {
      try {
        const content = JSON.parse(offlineContent);
        // Only set content if editor is empty or if we're offline
        if (this.networkStatus === 'offline' || this.editor.isEmpty) {
          this.editor.commands.setContent(content);
        }
      } catch (error) {
        console.error('Failed to load offline document:', error);
      }
    }
  }

  saveOffline() {
    if (!this.editor) return;

    const content = this.editor.getHTML();
    const offlineKey = `document-${this.documentId}-offline`;
    
    try {
      localStorage.setItem(offlineKey, JSON.stringify(content));
      this.hasOfflineChanges = false;
      this.lastSaved = new Date();
      
      // Save through file service and add to File Manager list
      this.fileService.saveDocumentLocally(this.documentId, this.documentName)
        .subscribe((success: boolean) => {
          if (success) {
            console.log('Document saved offline and added to File Manager');
          }
        });
    } catch (error) {
      console.error('Failed to save document offline:', error);
    }
  }

  syncOfflineChanges() {
    this.shareService.syncOfflineChanges()
      .subscribe((success: boolean) => {
        if (success) {
          this.hasOfflineChanges = false;
          this.lastSaved = new Date();
          console.log('Offline changes synced successfully');
        } else {
          console.error('Failed to sync offline changes');
        }
      });
  }

  private handleRTLTextDirection() {
    if (!this.editor) return;

    const { state } = this.editor;
    const { from, to } = state.selection;
    
    // Get the current paragraph or block
    const $from = state.doc.resolve(from);
    const currentBlock = $from.parent;
    
    if (currentBlock.type.name === 'paragraph' || currentBlock.type.name.includes('heading')) {
      const text = currentBlock.textContent;
      
      if (text.trim()) {
        const direction = this.detectTextDirection(text);
        const editorElement = this.editor.view.dom as HTMLElement;
        
        // Set direction on the current block
        const blockElement = this.findBlockElement($from);
        if (blockElement) {
          blockElement.dir = direction;
          
          // Also set on the editor container for overall direction context
          if (direction === 'rtl') {
            editorElement.classList.add('has-rtl-content');
          } else {
            editorElement.classList.remove('has-rtl-content');
          }
        }
      }
    }
  }

  private detectTextDirection(text: string): 'ltr' | 'rtl' {
    // RTL character ranges (Arabic, Hebrew, Persian, etc.)
    const rtlRegex = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/;
    
    // Count RTL characters
    const rtlMatches = (text.match(new RegExp(rtlRegex, 'g')) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    
    // If more than 30% of characters are RTL, consider it RTL text
    return totalChars > 0 && (rtlMatches / totalChars) > 0.3 ? 'rtl' : 'ltr';
  }

  private findBlockElement(resolvedPos: any): HTMLElement | null {
    const editorView = this.editor?.view;
    if (!editorView) return null;

    try {
      const domPos = editorView.domAtPos(resolvedPos.pos);
      let element = domPos.node as HTMLElement;
      
      // Walk up the DOM tree to find the block element
      while (element && element !== editorView.dom) {
        if (element.nodeType === Node.ELEMENT_NODE) {
          const tagName = element.tagName.toLowerCase();
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(tagName)) {
            return element;
          }
        }
        element = element.parentElement as HTMLElement;
      }
    } catch (error) {
      // Silently handle any errors in DOM positioning
      console.debug('Error finding block element:', error);
    }
    
    return null;
  }

  private setupPageManagement() {
    // Listen for content changes and window resize
    this.contentChangeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.checkPageBreaks();
      });

    // Initial page setup
    if (!this.pages.length) {
      this.pages = [0];
    }
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.checkPageBreaks();
    });

    this.editorElements.forEach(element => {
      this.resizeObserver?.observe(element.nativeElement);
    });
  }

  private checkPageBreaks() {
    if (!this.editor || !this.editorElements) return;

    const editorContent = this.editor.getHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorContent;
    tempDiv.style.width = '170mm'; // A4 width minus margins
    tempDiv.style.visibility = 'hidden';
    document.body.appendChild(tempDiv);

    const contentHeight = tempDiv.offsetHeight;
    const pageHeight = 257; // Height in mm (A4 height - margins)
    const requiredPages = Math.max(1, Math.ceil(contentHeight / pageHeight));

    document.body.removeChild(tempDiv);

    // Update pages array if needed
    if (requiredPages > this.pages.length) {
      const newPages = Array(requiredPages).fill(0).map((_, i) => i);
      this.pages = newPages;
      
      // Trigger change detection
      setTimeout(() => {
        this.editorElements.forEach((element, index) => {
          if (!element?.nativeElement) return;
          
          const el = element.nativeElement;
          if (index === 0) {
            // First page gets the editor instance
            if (!this.editor) return;
            this.editor.setOptions({
              element: el
            });
          }
        });
      });
    }
  }

  // Add this new method to handle content distribution
  private distributeContent() {
    if (!this.editor || !this.editorElements) return;

    const content = this.editor.getHTML();
    const pageHeight = 257; // mm

    this.editorElements.forEach((element, index) => {
      if (!element?.nativeElement) return;
      
      const el = element.nativeElement;
      if (index === 0) {
        el.innerHTML = content;
      }
    });
  }

  // Document statistics methods
  private updateDocumentStats() {
    if (!this.editor) return;

    const text = this.editor.getText();
    
    // Calculate word count
    this.wordCount = text.trim()
      ? text.trim().split(/\s+/).length
      : 0;

    // Calculate character count (excluding spaces)
    this.charCount = text.replace(/\s/g, '').length;

    // Calculate paragraph count
    const content = this.editor.getJSON()?.content;
    this.paragraphCount = content
      ? content.filter(node => node.type === 'paragraph' && node.content && node.content.length > 0).length
      : 0;
  }

  // Zoom methods
  zoomIn() {
    if (this.currentZoom < 2) {
      this.currentZoom = Math.min(2, this.currentZoom + 0.1);
      this.applyZoom();
    }
  }

  zoomOut() {
    if (this.currentZoom > 0.5) {
      this.currentZoom = Math.max(0.5, this.currentZoom - 0.1);
      this.applyZoom();
    }
  }

  private applyZoom() {
    this.editorElements.forEach(element => {
      if (!element?.nativeElement) return;
      const el = element.nativeElement;
      el.style.transform = `scale(${this.currentZoom})`;
      el.style.transformOrigin = 'top left';
    });
  }

  startDrag(which: 'left' | 'right', event: MouseEvent) {
    this.dragging = which;
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
  }

  onDrag = (event: MouseEvent) => {
    if (!this.dragging) return;
    const svg = document.querySelector('.margin-ruler svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const mm = x / 3.78;
    if (this.dragging === 'left') {
      this.leftMargin = Math.max(5, Math.min(mm, this.rulerWidth - this.rightMargin - 20));
    } else {
      this.rightMargin = Math.max(5, Math.min(this.rulerWidth - mm, this.rulerWidth - this.leftMargin - 20));
    }
  };

  stopDrag = () => {
    this.dragging = null;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  };
}