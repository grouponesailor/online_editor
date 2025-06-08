import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Shape as ShapeExtension } from '../../../extensions/shape';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import StarterKit from '@tiptap/starter-kit';
import { EditorService } from 'src/app/core/services/editor.service';
import { CommentsService } from '../../services/comments.service';

interface FontFamily {
  label: string;
  value: string;
}

interface FontSize {
  label: string;
  value: string;
}

interface ImageEdit {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotation: number;
}

interface ToolbarTab {
  id: string;
  label: string;
  icon: string;
}

interface ShapeDefinition {
  id: string;
  name: string;
  svgPath: string;
}

interface Page {
  content: string;
  paragraphCount: number;
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('editorContent') editorContent!: ElementRef;
  @Input() documentId: string = '';
  @Output() contentChange = new EventEmitter<string[]>();

  editor: Editor | null = null;

  // UI state
  currentTab: string = 'home';
  currentZoom: number = 1;
  showShareDialog = false;
  showTextColorPicker = false;
  showHighlightPicker = false;
  showLineSpacingMenu = false;
  showTableMenu = false;
  showImageMenu = false;
  showImageEditDialog = false;
  showHeadingMenu = false;
  showListMenu = false;
  formatPainterActive = false;
  selectedImage: any = null;

  // Current selections
  currentFontFamily = 'Arial, sans-serif';
  currentFontSize = '12';
  currentHeading = 'paragraph';
  currentTextColor = '#000000';
  currentHighlightColor = '#FFEB3B';
  tableSelection = { row: 0, col: 0 };

  // Common color presets
  commonTextColors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#808080', // Gray
    '#000080', // Navy
    '#008000', // Dark Green
    '#800000', // Maroon
    '#FFC0CB'  // Pink
  ];

  commonHighlightColors = [
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#FFA500', // Orange
    '#FF0000', // Red
    '#FFB6C1', // Light Pink
    '#98FB98', // Pale Green
    '#87CEEB', // Sky Blue
    '#DDA0DD', // Plum
    '#F0E68C', // Khaki
    '#FFE4B5', // Moccasin
    '#E6E6FA', // Lavender
    '#FFFACD', // Lemon Chiffon
    '#F5DEB3', // Wheat
    '#D3D3D3'  // Light Gray
  ];

  // Metadata properties
  wordCount: number = 0;
  readingTime: number = 0;
  paragraphCount: number = 0;
  currentPage: number = 1;
  totalPages: number = 1;
  characterCount: number = 0;

  // Page management
  pages: Page[] = [{ content: '', paragraphCount: 0 }];
  readonly WORDS_PER_PAGE = 500; // Approximate words that fit on an A4 page
  readonly CHARACTERS_PER_LINE = 90; // Approximate characters that fit on a line
  readonly LINES_PER_PAGE = 40; // Approximate lines that fit on an A4 page

  private destroy$ = new Subject<void>();

  constructor(
    private sanitizer: DomSanitizer,
    private editorService: EditorService,
    private commentsService: CommentsService
  ) {}

  ngOnInit() {
    // Subscribe to editor instance from service
    this.editorService.editor$
      .pipe(takeUntil(this.destroy$))
      .subscribe((editor: Editor | null) => {
        this.editor = editor;
        if (this.editor) {
          this.setupEditorListeners();
          this.updateMetadata();
        }
      });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.showHeadingMenu = false;
        this.showTableMenu = false;
        this.showImageMenu = false;
        this.showLineSpacingMenu = false;
        this.showListMenu = false;
      }
      // Close color pickers when clicking outside
      if (!target.closest('.fixed') && !target.closest('[data-color-trigger]')) {
        this.showTextColorPicker = false;
        this.showHighlightPicker = false;
      }
    });

    this.initializeEditor();
    this.setupPageBreakDetection();
  }

  ngAfterViewInit() {
    this.initEditor();
    this.updatePageMetrics();
  }

  private initEditor() {
    if (this.editorContent) {
      this.editor = new Editor({
        element: this.editorContent.nativeElement,
        extensions: [
          StarterKit,
          // Add other extensions as needed
        ],
        content: '',
        onUpdate: ({ editor }) => {
          this.updateMetadata();
        },
        onSelectionUpdate: ({ editor }) => {
          this.updateCurrentFormatting();
        }
      });

      this.setupEditorListeners();
    }
  }

  ngOnDestroy() {
    this.editor?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editor'] && this.editor) {
      this.setupEditorListeners();
      this.setupMetadataListeners();
    }
  }

  // Options
  fontFamilies: FontFamily[] = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Helvetica', value: 'Helvetica, sans-serif' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
    { label: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' }
  ];

  fontSizes: FontSize[] = [
    { label: '8pt', value: '8' },
    { label: '9pt', value: '9' },
    { label: '10pt', value: '10' },
    { label: '11pt', value: '11' },
    { label: '12pt', value: '12' },
    { label: '14pt', value: '14' },
    { label: '16pt', value: '16' },
    { label: '18pt', value: '18' },
    { label: '20pt', value: '20' },
    { label: '24pt', value: '24' },
    { label: '28pt', value: '28' },
    { label: '32pt', value: '32' },
    { label: '36pt', value: '36' },
    { label: '48pt', value: '48' },
    { label: '72pt', value: '72' }
  ];

  headingItems = [
    {
      label: 'Paragraph',
      value: 'paragraph',
      shortcut: 'Ctrl+Alt+0',
      command: (editor: Editor | null) => editor?.chain().focus().setParagraph().run()
    },
    {
      label: 'Heading 1',
      value: 'h1',
      shortcut: 'Ctrl+Alt+1',
      command: (editor: Editor | null) => editor?.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
      label: 'Heading 2', 
      value: 'h2',
      shortcut: 'Ctrl+Alt+2',
      command: (editor: Editor | null) => editor?.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      label: 'Heading 3',
      value: 'h3', 
      shortcut: 'Ctrl+Alt+3',
      command: (editor: Editor | null) => editor?.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      label: 'Heading 4',
      value: 'h4',
      shortcut: 'Ctrl+Alt+4',
      command: (editor: Editor | null) => editor?.chain().focus().toggleHeading({ level: 4 }).run()
    },
    {
      label: 'Heading 5',
      value: 'h5',
      shortcut: 'Ctrl+Alt+5',
      command: (editor: Editor | null) => editor?.chain().focus().toggleHeading({ level: 5 }).run()
    },
    {
      label: 'Heading 6',
      value: 'h6',
      shortcut: 'Ctrl+Alt+6',
      command: (editor: Editor | null) => editor?.chain().focus().toggleHeading({ level: 6 }).run()
    }
  ];

  listItems = [
    {
      label: 'Bullet List (Disc)',
      value: 'bullet-disc',
      icon: 'fas fa-list-ul',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleBulletList().run();
        this.setListStyle('disc');
      }
    },
    {
      label: 'Bullet List (Circle)',
      value: 'bullet-circle',
      icon: 'far fa-circle',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleBulletList().run();
        this.setListStyle('circle');
      }
    },
    {
      label: 'Bullet List (Square)',
      value: 'bullet-square',
      icon: 'fas fa-square',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleBulletList().run();
        this.setListStyle('square');
      }
    },
    {
      label: 'Numbered List (1, 2, 3)',
      value: 'ordered-decimal',
      icon: 'fas fa-list-ol',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleOrderedList().run();
        this.setListStyle('decimal');
      }
    },
    {
      label: 'Numbered List (a, b, c)',
      value: 'ordered-alpha',
      icon: 'fas fa-sort-alpha-down',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleOrderedList().run();
        this.setListStyle('lower-alpha');
      }
    },
    {
      label: 'Numbered List (A, B, C)',
      value: 'ordered-alpha-upper',
      icon: 'fas fa-sort-alpha-up',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleOrderedList().run();
        this.setListStyle('upper-alpha');
      }
    },
    {
      label: 'Numbered List (i, ii, iii)',
      value: 'ordered-roman',
      icon: 'fas fa-list-ol',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleOrderedList().run();
        this.setListStyle('lower-roman');
      }
    },
    {
      label: 'Numbered List (I, II, III)',
      value: 'ordered-roman-upper',
      icon: 'fas fa-list-ol',
      command: (editor: Editor | null) => {
        editor?.chain().focus().toggleOrderedList().run();
        this.setListStyle('upper-roman');
      }
    },
    {
      label: 'Task List',
      value: 'task',
      icon: 'fas fa-tasks',
      command: (editor: Editor | null) => editor?.chain().focus().toggleTaskList().run()
    }
  ];

  tabs: ToolbarTab[] = [
    { id: 'file', label: 'File', icon: 'fas fa-file' },
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'insert', label: 'Insert', icon: 'fas fa-plus' },
    { id: 'shapes', label: 'Shapes', icon: 'fas fa-shapes' },
    { id: 'format', label: 'Format', icon: 'fas fa-palette' },
    { id: 'view', label: 'View', icon: 'fas fa-eye' }
  ];

  shapes: ShapeDefinition[] = [
    {
      id: 'rectangle',
      name: 'Rectangle',
      svgPath: `<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" rx="2"/></svg>`
    },
    {
      id: 'circle',
      name: 'Circle',
      svgPath: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    },
    {
      id: 'triangle',
      name: 'Triangle',
      svgPath: `<svg viewBox="0 0 32 32"><path d="M16 4 L28 28 L4 28 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    },
    {
      id: 'arrow',
      name: 'Arrow',
      svgPath: `<svg viewBox="0 0 32 32"><path d="M4 16 L24 16 M18 8 L24 16 L18 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    {
      id: 'star',
      name: 'Star',
      svgPath: `<svg viewBox="0 0 32 32"><path d="M16 4 L19 13 L28 13 L21 19 L24 28 L16 23 L8 28 L11 19 L4 13 L13 13 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    },
    {
      id: 'hexagon',
      name: 'Hexagon',
      svgPath: `<svg viewBox="0 0 32 32"><path d="M16 4 L26 10 L26 22 L16 28 L6 22 L6 10 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    },
    {
      id: 'diamond',
      name: 'Diamond',
      svgPath: `<svg viewBox="0 0 32 32"><path d="M16 4 L28 16 L16 28 L4 16 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    },
    {
      id: 'cloud',
      name: 'Cloud',
      svgPath: `<svg viewBox="0 0 32 32"><path d="M8 16 C8 12 10 8 16 8 C22 8 24 12 24 16 C28 16 28 20 28 20 C28 24 24 24 24 24 L12 24 C12 24 4 24 4 20 C4 16 8 16 8 16 Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
    }
  ];

  tableGrid = Array.from({ length: 64 }, (_, i) => ({
    row: Math.floor(i / 8) + 1,
    col: (i % 8) + 1,
    selected: false
  }));

  textFormatItems = [
    {
      label: 'Bold',
      command: (editor: Editor | null) => editor?.chain().focus().toggleMark('bold').run(),
      type: 'bold',
      icon: 'fas fa-bold'
    },
    {
      label: 'Italic',
      command: (editor: Editor | null) => editor?.chain().focus().toggleMark('italic').run(),
      type: 'italic',
      icon: 'fas fa-italic'
    },
    {
      label: 'Underline',
      command: (editor: Editor | null) => editor?.chain().focus().toggleMark('underline').run(),
      type: 'underline',
      icon: 'fas fa-underline'
    },
    {
      label: 'Strike',
      command: (editor: Editor | null) => editor?.chain().focus().toggleMark('strike').run(),
      type: 'strike',
      icon: 'fas fa-strikethrough'
    },
    {
      label: 'Subscript',
      command: (editor: Editor | null) => editor?.chain().focus().toggleMark('subscript').run(),
      type: 'subscript',
      icon: 'fas fa-subscript'
    },
    {
      label: 'Superscript',
      command: (editor: Editor | null) => editor?.chain().focus().toggleMark('superscript').run(),
      type: 'superscript',
      icon: 'fas fa-superscript'
    }
  ];

  alignmentItems = [
    {
      label: 'Align Left',
      command: (editor: Editor | null) => editor?.chain().focus().setTextAlign('left').run(),
      align: 'left',
      icon: 'fas fa-align-left'
    },
    {
      label: 'Align Center',
      command: (editor: Editor | null) => editor?.chain().focus().setTextAlign('center').run(),
      align: 'center',
      icon: 'fas fa-align-center'
    },
    {
      label: 'Align Right',
      command: (editor: Editor | null) => editor?.chain().focus().setTextAlign('right').run(),
      align: 'right',
      icon: 'fas fa-align-right'
    },
    {
      label: 'Justify',
      command: (editor: Editor | null) => editor?.chain().focus().setTextAlign('justify').run(),
      align: 'justify',
      icon: 'fas fa-align-justify'
    }
  ];

  setupEditorListeners() {
    if (!this.editor) return;

    // Listen for selection updates to reflect current formatting
    this.editor.on('selectionUpdate', () => {
      this.updateCurrentFormatting();
    });

    this.editor.on('transaction', () => {
      this.updateCurrentFormatting();
      this.updatePages();
    });
  }

  private updateCurrentFormatting() {
    if (!this.editor) return;

    const { state } = this.editor;
    const { from, to } = state.selection;

    // Update current font family
    const fontFamilyMark = this.editor.getAttributes('textStyle');
    if (fontFamilyMark['fontFamily']) {
      this.currentFontFamily = fontFamilyMark['fontFamily'];
    }

    // Update current font size
    const fontSizeMark = this.editor.getAttributes('fontSize');
    if (fontSizeMark['size']) {
      // Remove 'px' unit if present to match our dropdown values
      this.currentFontSize = fontSizeMark['size'].replace('px', '');
    }

    // Update text color
    const colorMark = this.editor.getAttributes('textStyle');
    if (colorMark['color']) {
      this.currentTextColor = colorMark['color'];
    }

    // Update highlight color
    const highlightMark = this.editor.getAttributes('highlight');
    if (highlightMark['color']) {
      this.currentHighlightColor = highlightMark['color'];
    }

    // Update current heading
    this.updateCurrentHeading();
  }

  private updateCurrentHeading() {
    if (!this.editor) return;

    // Check which heading level is active
    for (let level = 1; level <= 6; level++) {
      if (this.editor.isActive('heading', { level })) {
        this.currentHeading = `h${level}`;
        return;
      }
    }

    // If no heading is active, it's a paragraph
    this.currentHeading = 'paragraph';
  }

  // Font handling
  setFontFamily(event: any) {
    const font = event.target.value;
    this.currentFontFamily = font;
    
    if (!this.editor) return;
    
    // Use the proper command for setting font family
    this.editor.chain()
      .focus()
      .setMark('textStyle', { fontFamily: font })
      .run();
  }

  setFontSize(event: any) {
    const size = event.target.value;
    this.currentFontSize = size;
    
    if (!this.editor) return;
    
    // Ensure the font size includes proper units (px)
    const sizeWithUnit = size.includes('px') ? size : `${size}px`;
    
    // Use the proper command for setting font size
    this.editor.chain()
      .focus()
      .setMark('fontSize', { size: sizeWithUnit })
      .run();
  }

  // Get current document name from the editor component
  getCurrentDocumentName(): string {
    // Try to get document name from localStorage
    const savedName = localStorage.getItem(`doc-name-${this.documentId}`);
    return savedName || 'Untitled Document';
  }

  // File operations
  onNewDocument() {
    if (confirm('Create a new document? Any unsaved changes will be lost.')) {
      window.location.href = '/documents/new';
    }
  }

  onOpenDocument() {
    // Navigate to file manager
    window.location.href = '/file/manager';
  }

  onSaveDocument() {
    // Trigger save event
    console.log('Save document');
  }

  onExportPDF() {
    console.log('Export as PDF');
  }

  onExportWord() {
    console.log('Export as Word');
  }

  onPrint() {
    window.print();
  }

  openRecentDocuments() {
    window.location.href = '/file/manager';
  }

  // Share functionality
  toggleShareDialog() {
    this.showShareDialog = !this.showShareDialog;
  }

  // Table handling
  updateTableSelection(row: number, col: number) {
    this.tableSelection = { row, col };
    this.tableGrid.forEach(cell => {
      cell.selected = cell.row <= row && cell.col <= col;
    });
  }

  insertTable(rows: number, cols: number) {
    this.editor?.chain().focus()
      .insertContent(`<table>${'<tr>' + '<td></td>'.repeat(cols) + '</tr>'.repeat(rows)}</table>`)
      .run();
    this.showTableMenu = false;
  }

  // Image handling
  async uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          this.insertImage(result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  insertImageByUrl() {
    const url = window.prompt('Enter the URL of the image:');
    if (url) {
      this.insertImage(url);
    }
  }

  searchImage() {
    // Implement image search functionality
  }

  insertImage(src: string) {
    this.editor?.chain().focus()
      .insertContent(`<img src="${src}" alt="Image" />`)
      .run();
    this.showImageMenu = false;
  }

  updateImage(imageEdit: ImageEdit) {
    if (!this.editor || !this.selectedImage) return;

    const { state } = this.editor;
    const { from, to } = state.selection;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'image') {
        this.editor?.chain().focus()
          .insertContent(`<img src="${imageEdit.src}" alt="${imageEdit.alt || ''}" title="${imageEdit.title || ''}" />`)
          .run();
      }
    });

    this.showImageEditDialog = false;
  }

  // Helper methods for editor operations
  handleUndo() {
    this.editor?.commands.undo();
  }

  handleRedo() {
    this.editor?.commands.redo();
  }

  canUndo(): boolean {
    return !!this.editor?.can().undo();
  }

  canRedo(): boolean {
    return !!this.editor?.can().redo();
  }

  sanitizeHTML(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  insertShape(shape: ShapeDefinition) {
    if (!this.editor) return;

    this.editor.chain()
      .focus()
      .insertContent(`<div class="shape-node" data-type="${shape.id}">${shape.svgPath}</div>`)
      .run();
  }

  zoomIn() {
    if (this.currentZoom < 2) {
      this.currentZoom += 0.1;
      this.applyZoom();
    }
  }

  zoomOut() {
    if (this.currentZoom > 0.5) {
      this.currentZoom -= 0.1;
      this.applyZoom();
    }
  }

  private applyZoom() {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
      (page as HTMLElement).style.transform = `scale(${this.currentZoom})`;
    });
  }

  // Text color methods
  toggleTextColor() {
    this.showTextColorPicker = !this.showTextColorPicker;
    // Close highlight picker if open
    if (this.showTextColorPicker) {
      this.showHighlightPicker = false;
    }
  }

  selectTextColor(color: string) {
    this.currentTextColor = color;
    this.applyTextColor();
  }

  applyTextColor() {
    if (!this.editor) return;
    this.editor.chain().focus().setMark('textStyle', { color: this.currentTextColor }).run();
    this.showTextColorPicker = false;
  }

  removeTextColor() {
    if (!this.editor) return;
    this.editor.chain().focus().unsetMark('textStyle').run();
    this.showTextColorPicker = false;
  }

  // Highlight methods
  toggleHighlight() {
    this.showHighlightPicker = !this.showHighlightPicker;
    // Close text color picker if open
    if (this.showHighlightPicker) {
      this.showTextColorPicker = false;
    }
  }

  selectHighlightColor(color: string) {
    this.currentHighlightColor = color;
    this.applyHighlight();
  }

  applyHighlight() {
    if (!this.editor) return;
    this.editor.chain().focus().setMark('highlight', { color: this.currentHighlightColor }).run();
    this.showHighlightPicker = false;
  }

  removeHighlight() {
    if (!this.editor) return;
    this.editor.chain().focus().unsetMark('highlight').run();
    this.showHighlightPicker = false;
  }

  // Line height method
  setLineHeight(height: string) {
    this.editor?.chain().focus().updateAttributes('paragraph', { lineHeight: height }).run();
    this.showLineSpacingMenu = false;
  }

  // Format painter method
  toggleFormatPainter() {
    this.formatPainterActive = !this.formatPainterActive;
    // Implement format painter logic here
    if (this.formatPainterActive) {
      // Store current formatting
      console.log('Format painter activated');
    } else {
      // Apply stored formatting
      console.log('Format painter deactivated');
    }
  }

  // Heading functionality
  setHeading(headingValue: string) {
    if (!this.editor) return;

    const headingItem = this.headingItems.find(item => item.value === headingValue);
    if (headingItem) {
      headingItem.command(this.editor);
      this.currentHeading = headingValue;
      this.showHeadingMenu = false;
    }
  }

  getCurrentHeadingLabel(): string {
    const headingItem = this.headingItems.find(item => item.value === this.currentHeading);
    return headingItem ? headingItem.label : 'Paragraph';
  }

  setListStyle(style: string) {
    if (!this.editor) return;

    setTimeout(() => {
      const editorElement = this.editor?.view.dom as HTMLElement;
      if (editorElement) {
        // Find the currently selected list
        const listElements = editorElement.querySelectorAll('ul, ol');
        listElements.forEach(list => {
          if (list.tagName.toLowerCase() === 'ul') {
            (list as HTMLElement).style.listStyleType = style;
          } else if (list.tagName.toLowerCase() === 'ol') {
            (list as HTMLElement).style.listStyleType = style;
          }
        });
      }
    }, 100);
  }

  // List action methods to avoid TypeScript errors
  toggleBulletList() {
    if (this.editor) {
      this.editor.chain().focus().toggleBulletList().run();
    }
  }

  toggleOrderedList() {
    if (this.editor) {
      this.editor.chain().focus().toggleOrderedList().run();
    }
  }

  toggleTaskList() {
    if (this.editor) {
      this.editor.chain().focus().toggleTaskList().run();
    }
  }

  private setupMetadataListeners() {
    if (!this.editor) return;

    // Update metadata when content changes
    this.editor.on('update', () => {
      this.updateMetadata();
    });
  }

  private updatePages() {
    if (!this.editor) return;

    const content = this.editor.getHTML();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const paragraphs = tempDiv.getElementsByTagName('p');
    const newPages: Page[] = [{ content: '', paragraphCount: 0 }];
    let currentPage = 0;
    let currentPageHeight = 0;
    const PAGE_HEIGHT = 257; // height in mm of A4 page minus margins

    // Process each paragraph
    Array.from(paragraphs).forEach((p) => {
      const clone = p.cloneNode(true) as HTMLElement;
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(clone);
      
      // Add paragraph to current page
      if (newPages[currentPage].content) {
        newPages[currentPage].content += tempContainer.innerHTML;
      } else {
        newPages[currentPage].content = tempContainer.innerHTML;
      }
      newPages[currentPage].paragraphCount++;

      // Estimate height (this is approximate)
      currentPageHeight += 20; // Assume average paragraph height
      
      // Check if we need a new page
      if (currentPageHeight > PAGE_HEIGHT) {
        currentPage++;
        currentPageHeight = 0;
        newPages.push({ content: '', paragraphCount: 0 });
      }
    });

    this.pages = newPages;
    this.updateMetadata();
  }

  private updateMetadata() {
    if (!this.editor) return;

    const content = this.editor.getText();
    
    // Calculate character count
    this.characterCount = content.length;
    
    // Calculate word count
    this.wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

    // Calculate reading time (assuming average reading speed of 200 words per minute)
    this.readingTime = Math.max(1, Math.ceil(this.wordCount / 200));

    // Calculate paragraph count
    const paragraphs = this.editor.getHTML().split('</p>').length - 1;
    this.paragraphCount = Math.max(1, paragraphs);

    // Calculate total pages (assuming ~500 words per page)
    this.totalPages = Math.max(1, Math.ceil(this.wordCount / 500));
    
    // Ensure current page is valid
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToPage(this.currentPage);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToPage(this.currentPage);
    }
  }

  private scrollToPage(pageNumber: number) {
    const pageElement = document.querySelector(`[data-page="${pageNumber}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private initializeEditor() {
    // Add page break detection
    this.editor?.on('update', () => {
      this.detectPageBreaks();
      this.updateDocumentStats();
    });
  }

  private setupPageBreakDetection() {
    // Create an observer to watch for content changes
    const observer = new ResizeObserver(() => {
      this.detectPageBreaks();
    });

    // Observe the editor content
    if (this.editorContent?.nativeElement) {
      observer.observe(this.editorContent.nativeElement);
    }
  }

  private detectPageBreaks() {
    if (!this.editorContent?.nativeElement) return;

    const content = this.editorContent.nativeElement;
    const contentHeight = content.scrollHeight;
    const pageHeight = 257; // Height in mm (297mm - 40mm margins)
    const pageCount = Math.ceil(contentHeight / pageHeight);

    // Update pages array if needed
    if (pageCount > this.pages.length) {
      while (this.pages.length < pageCount) {
        this.addNewPage();
      }
    }
  }

  addNewPage() {
    this.pages.push({ content: '', paragraphCount: 0 });
    this.updatePageMetrics();
  }

  private updatePageMetrics() {
    // Update page numbers and other metrics
    this.updateDocumentStats();
  }

  private updateDocumentStats() {
    if (!this.editor) return;

    const text = this.editor.getText();
    this.wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    this.characterCount = text.length;
    this.paragraphCount = (text.match(/\n\n/g) || []).length + 1;
    this.readingTime = Math.ceil(this.wordCount / 200); // Assuming 200 words per minute
  }

  // Editor content change handler
  onEditorContentChange(content: string[]) {
    this.contentChange.emit(content);
  }

  toggleComments() {
    this.commentsService.toggleSidebar();
  }
}