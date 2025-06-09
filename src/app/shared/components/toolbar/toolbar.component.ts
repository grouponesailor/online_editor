import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Shape as ShapeExtension } from '../../../extensions/shape';
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
  showTextColorPalette = false;
  showHighlightPalette = false;
  formatPainterActive = false;
  selectedImage: any = null;

  // Current selections
  currentFontFamily = 'Arial, sans-serif';
  currentFontSize = '12';
  currentHeading = 'paragraph';
  currentTextColor = '#000000';
  currentHighlightColor = '#FFEB3B';
  customTextColor = '#000000';
  customHighlightColor = '#FFEB3B';
  tableSelection = { row: 0, col: 0 };

  // Color options
  commonColors: string[] = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFFF00', // Yellow
    '#808080', // Gray
    '#800000', // Dark Red
    '#008000', // Dark Green
  ];

  highlightColors: string[] = [
    '#FFEB3B', // Yellow
    '#FF9800', // Orange
    '#F44336', // Red
    '#E91E63', // Pink
    '#9C27B0', // Purple
    '#673AB7', // Deep Purple
    '#3F51B5', // Indigo
    '#2196F3', // Blue
    '#03A9F4', // Light Blue
    '#00BCD4', // Cyan
  ];

  private destroy$ = new Subject<void>();

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.color-palette-container')) {
        this.showTextColorPalette = false;
        this.showHighlightPalette = false;
      }
      if (!target.closest('.dropdown-container')) {
        this.showHeadingMenu = false;
        this.showTableMenu = false;
        this.showImageMenu = false;
        this.showLineSpacingMenu = false;
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

  // Helper method to determine if a color is light
  isLightColor(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }

  insertShape(shape: ShapeDefinition) {
    if (!this.editor) return;

    this.editor.chain()
      .focus()
      .insertContent(`<div class="shape-node" data-type="${shape.id}">${shape.svgPath}</div>`)
      .run();
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

  applyTextColor(color: string) {
    if (this.editor) {
      this.editor.chain().focus().setColor(color).run();
      this.currentTextColor = color;
      this.showTextColorPalette = false;
    }
  }

  // Highlight methods
  toggleHighlight() {
    this.showHighlightPicker = !this.showHighlightPicker;
  }

  applyHighlight(color: string) {
    if (this.editor) {
      this.editor.chain().focus().setHighlight({ color }).run();
      this.currentHighlightColor = color;
      this.showHighlightPalette = false;
    }
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
}