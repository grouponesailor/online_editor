import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Shape as ShapeExtension } from '../../../extensions/shape';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
export class ToolbarComponent implements OnChanges {
  @Input() editor: Editor | null = null;
  @Input() documentId: string = '';

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
  formatPainterActive = false;
  selectedImage: any = null;

  // Current selections
  currentFontFamily = 'Arial';
  currentFontSize = '11';
  currentTextColor = '#000000';
  currentHighlightColor = '#FFEB3B';
  tableSelection = { row: 0, col: 0 };

  constructor(private sanitizer: DomSanitizer) {}

  // Options
  fontFamilies: FontFamily[] = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' }
  ];

  fontSizes: FontSize[] = [
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '10', value: '10' },
    { label: '11', value: '11' },
    { label: '12', value: '12' },
    { label: '14', value: '14' },
    { label: '16', value: '16' },
    { label: '18', value: '18' },
    { label: '24', value: '24' },
    { label: '30', value: '30' },
    { label: '36', value: '36' },
    { label: '48', value: '48' }
  ];

  tabs: ToolbarTab[] = [
    { id: 'home', label: 'Home', icon: 'fas fa-home' },
    { id: 'insert', label: 'Insert', icon: 'fas fa-plus' },
    { id: 'shapes', label: 'Shapes', icon: 'fas fa-shapes' },
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
      command: (editor: Editor | null) => editor?.chain().focus().updateAttributes('paragraph', { textAlign: 'left' }).run(),
      align: 'left',
      icon: 'fas fa-align-left'
    },
    {
      label: 'Align Center',
      command: (editor: Editor | null) => editor?.chain().focus().updateAttributes('paragraph', { textAlign: 'center' }).run(),
      align: 'center',
      icon: 'fas fa-align-center'
    },
    {
      label: 'Align Right',
      command: (editor: Editor | null) => editor?.chain().focus().updateAttributes('paragraph', { textAlign: 'right' }).run(),
      align: 'right',
      icon: 'fas fa-align-right'
    },
    {
      label: 'Justify',
      command: (editor: Editor | null) => editor?.chain().focus().updateAttributes('paragraph', { textAlign: 'justify' }).run(),
      align: 'justify',
      icon: 'fas fa-align-justify'
    }
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editor'] && this.editor) {
      this.setupEditorListeners();
    }
  }

  setupEditorListeners() {
    // Add editor event listeners here
  }

  // Font handling
  setFontFamily(event: any) {
    const font = event.target.value;
    this.currentFontFamily = font;
    this.editor?.chain().focus().updateAttributes('textStyle', { fontFamily: font }).run();
  }

  setFontSize(event: any) {
    const size = event.target.value;
    this.currentFontSize = size;
    this.editor?.chain().focus().setMark('fontSize', { size: size }).run();
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
}