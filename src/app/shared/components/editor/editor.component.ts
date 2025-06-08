import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Page {
  content: string;
  zoom: number;
}

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  @ViewChild('editorContent') editorContent!: ElementRef;
  
  @Input() documentId: string = '';
  @Output() contentChange = new EventEmitter<string[]>();

  pages: Page[] = [{ content: '', zoom: 1 }];
  currentPage: number = 1;
  currentZoom: number = 1;
  
  // Document statistics
  wordCount: number = 0;
  characterCount: number = 0;
  paragraphCount: number = 0;
  readingTime: number = 0;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // Initialize with one empty page
    this.addNewPage();
    this.updateDocumentStats();
  }

  // Page Management
  addNewPage() {
    this.pages.push({ content: '', zoom: this.currentZoom });
    this.currentPage = this.pages.length;
    this.contentChange.emit(this.pages.map(page => page.content));
  }

  deletePage(index: number) {
    if (this.pages.length > 1) {
      this.pages.splice(index, 1);
      this.currentPage = Math.min(this.currentPage, this.pages.length);
      this.contentChange.emit(this.pages.map(page => page.content));
      this.updateDocumentStats();
    }
  }

  // Navigation
  nextPage() {
    if (this.currentPage < this.pages.length) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Content Management
  onPageContentChange(event: Event, pageIndex: number) {
    const content = (event.target as HTMLElement).innerHTML;
    this.pages[pageIndex].content = content;
    this.contentChange.emit(this.pages.map(page => page.content));
    this.updateDocumentStats();
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  // Zoom Controls
  zoomIn() {
    if (this.currentZoom < 2) {
      this.currentZoom += 0.1;
      this.updateZoom();
    }
  }

  zoomOut() {
    if (this.currentZoom > 0.5) {
      this.currentZoom -= 0.1;
      this.updateZoom();
    }
  }

  private updateZoom() {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
      (page as HTMLElement).style.transform = `scale(${this.currentZoom})`;
    });
  }

  // Document Statistics
  private updateDocumentStats() {
    const allContent = this.pages.map(page => page.content).join(' ');
    
    // Word count
    this.wordCount = allContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Character count
    this.characterCount = allContent.length;
    
    // Paragraph count
    this.paragraphCount = allContent.split(/\n\s*\n/).filter(para => para.trim().length > 0).length;
    
    // Reading time (assuming 200 words per minute)
    this.readingTime = Math.ceil(this.wordCount / 200);
  }

  // Sanitization helper
  sanitizeContent(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
} 