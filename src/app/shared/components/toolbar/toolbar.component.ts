import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Shape as ShapeExtension } from '../../../extensions/shape';
import { Signature as SignatureExtension } from '../../../extensions/signature';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';

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

interface HelpSection {
  title: string;
  icon: string;
  content: string;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit, OnDestroy, OnChanges {
  @Input() editor: Editor | null = null;
  @Input() documentId: string = '';

  // UI state
  currentTab: string = 'file';
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
  showShapesMenu = false;
  showSignatureMenu = false;
  showDiagramsMenu = false;
  formatPainterActive = false;
  selectedImage: any = null;
  showLinkDialog = false;
  linkUrl: string = '';
  linkText: string = '';

  // Current selections
  currentFontFamily = 'Arial, sans-serif';
  currentFontSize = '12';
  currentHeading = 'paragraph';
  currentTextColor = '#000000';
  currentHighlightColor = '#FFEB3B';
  tableSelection = { row: 0, col: 0 };
  signatures: string[] = [
    'Best regards,<br>Your Name',
    'Sincerely,<br>Your Name',
    'Kind regards,<br>Your Name',
    'Thanks,<br>Your Name'
  ];

  // Help tab properties
  selectedHelpSection: string = 'getting-started';
  
  helpSections: HelpSection[] = [
    {
      title: 'Getting Started',
      icon: 'fas fa-rocket',
      content: `
        <h2>Welcome to the Collaborative Document Editor!</h2>
        <p>This editor allows you to create and edit documents in real-time with others. Here are some basic features:</p>
        <ul>
          <li>Create new documents from the File tab</li>
          <li>Format text using the Home tab tools</li>
          <li>Insert tables, images, and more from the Insert tab</li>
          <li>Share your document using the Share button</li>
          <li>Collaborate in real-time with others</li>
        </ul>
      `
    },
    {
      title: 'Text Formatting',
      icon: 'fas fa-font',
      content: `
        <h2>Text Formatting</h2>
        <p>You can format your text in various ways:</p>
        <ul>
          <li>Change font family and size</li>
          <li>Apply bold, italic, and underline styles</li>
          <li>Use headings for document structure</li>
          <li>Change text color and highlighting</li>
          <li>Adjust line spacing and alignment</li>
        </ul>
      `
    },
    {
      title: 'Insert Features',
      icon: 'fas fa-plus-square',
      content: `
        <h2>Inserting Content</h2>
        <p>Enhance your documents with various types of content:</p>
        <ul>
          <li>Tables with customizable rows and columns</li>
          <li>Images from your computer or by URL</li>
          <li>Shapes and diagrams</li>
          <li>Professional signatures</li>
          <li>Lists and task lists</li>
        </ul>
      `
    },
    {
      title: 'Collaboration',
      icon: 'fas fa-users',
      content: `
        <h2>Real-time Collaboration</h2>
        <p>Work together with others seamlessly:</p>
        <ul>
          <li>Share documents with collaborators</li>
          <li>See others' cursors and selections</li>
          <li>Changes sync automatically</li>
          <li>Works offline with auto-sync</li>
          <li>Track document history</li>
        </ul>
      `
    }
  ];

  keyboardShortcuts: KeyboardShortcut[] = [
    { category: 'General', key: 'Ctrl + S', description: 'Save document' },
    { category: 'General', key: 'Ctrl + Z', description: 'Undo' },
    { category: 'General', key: 'Ctrl + Y', description: 'Redo' },
    { category: 'Formatting', key: 'Ctrl + B', description: 'Bold' },
    { category: 'Formatting', key: 'Ctrl + I', description: 'Italic' },
    { category: 'Formatting', key: 'Ctrl + U', description: 'Underline' },
    { category: 'Formatting', key: 'Ctrl + Alt + 1-6', description: 'Heading 1-6' },
    { category: 'Formatting', key: 'Ctrl + Alt + 0', description: 'Normal paragraph' },
    { category: 'Lists', key: 'Ctrl + Shift + 7', description: 'Ordered list' },
    { category: 'Lists', key: 'Ctrl + Shift + 8', description: 'Bullet list' },
    { category: 'Lists', key: 'Ctrl + Shift + 9', description: 'Task list' },
    { category: 'Tables', key: 'Tab', description: 'Next cell' },
    { category: 'Tables', key: 'Shift + Tab', description: 'Previous cell' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.showHeadingMenu = false;
        this.showTableMenu = false;
        this.showImageMenu = false;
        this.showLineSpacingMenu = false;
        this.showTextColorPicker = false;
        this.showHighlightPicker = false;
        this.showListMenu = false;
        this.showShapesMenu = false;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editor'] && this.editor) {
      this.setupEditorListeners();
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
    { id: 'insert', label: 'Insert', icon: 'fas fa-plus' }
  ];

  readonly shapes: ShapeDefinition[] = [
    {
      id: 'rectangle',
      name: 'Rectangle',
      svgPath: 'shape-rectangle'
    },
    {
      id: 'circle',
      name: 'Circle',
      svgPath: 'shape-circle'
    },
    {
      id: 'triangle',
      name: 'Triangle',
      svgPath: 'shape-triangle'
    },
    {
      id: 'star',
      name: 'Star',
      svgPath: 'shape-star'
    },
    {
      id: 'hexagon',
      name: 'Hexagon',
      svgPath: 'shape-hexagon'
    },
    {
      id: 'diamond',
      name: 'Diamond',
      svgPath: 'shape-diamond'
    },
    {
      id: 'cloud',
      name: 'Cloud',
      svgPath: 'shape-cloud'
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
    if (!this.editor) return;
    
    this.editor.chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
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

    try {
      this.editor.chain()
        .focus()
        .setShape({
          type: shape.id,
          svgPath: shape.svgPath
        })
        .run();
      this.showShapesMenu = false;
    } catch (error) {
      console.error('Error inserting shape:', error);
    }
  }

  zoomIn() {
    this.currentZoom = Math.min(this.currentZoom + 0.25, 2);
    this.setZoom();
  }

  zoomOut() {
    this.currentZoom = Math.max(this.currentZoom - 0.25, 0.5);
    this.setZoom();
  }

  setZoom() {
    const editorElement = this.editor?.view.dom as HTMLElement;
    if (editorElement) {
      editorElement.style.transform = `scale(${this.currentZoom})`;
      editorElement.style.transformOrigin = 'top left';
      editorElement.parentElement?.classList.add('overflow-auto');
    }
  }

  // Text color methods
  toggleTextColor() {
    this.showTextColorPicker = !this.showTextColorPicker;
  }

  applyTextColor() {
    this.editor?.chain().focus().setMark('textStyle', { color: this.currentTextColor }).run();
    this.showTextColorPicker = false;
  }

  // Highlight methods
  toggleHighlight() {
    this.showHighlightPicker = !this.showHighlightPicker;
  }

  applyHighlight() {
    this.editor?.chain().focus().setMark('highlight', { color: this.currentHighlightColor }).run();
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

  insertSignature(signature: string) {
    if (this.editor) {
      this.editor.chain().focus().insertSignature(signature).run();
      this.showSignatureMenu = false;
    }
  }

  addCustomSignature() {
    const customSignature = prompt('Enter your custom signature:');
    if (customSignature) {
      this.signatures.push(customSignature);
      this.insertSignature(customSignature);
    }
  }

  insertLink() {
    if (this.editor) {
      const { from, to } = this.editor.state.selection;
      const selectedText = this.editor.state.doc.textBetween(from, to, ' ');
      this.linkText = selectedText;
      this.showLinkDialog = true;
    }
  }

  applyLink() {
    if (this.editor && this.linkUrl) {
      if (this.linkText) {
        // If we have text, insert both text and link
        this.editor
          .chain()
          .focus()
          .insertContent({
            type: 'text',
            text: this.linkText,
            marks: [
              {
                type: 'link',
                attrs: {
                  href: this.linkUrl,
                  target: '_blank'
                }
              }
            ]
          })
          .run();
      } else {
        // If no text, just set the link on the selection
        this.editor
          .chain()
          .focus()
          .setLink({ href: this.linkUrl, target: '_blank' })
          .run();
      }
      
      // Reset and close dialog
      this.linkUrl = '';
      this.linkText = '';
      this.showLinkDialog = false;
    }
  }

  removeLink() {
    if (this.editor) {
      this.editor.chain().focus().unsetLink().run();
    }
  }
}