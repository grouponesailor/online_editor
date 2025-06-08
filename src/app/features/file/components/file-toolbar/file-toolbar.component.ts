import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-file-toolbar',
  templateUrl: './file-toolbar.component.html',
  styleUrls: ['./file-toolbar.component.css']
})
export class FileToolbarComponent {
  @Input() documentId: string = '';
  @Output() newDocument = new EventEmitter<void>();
  @Output() openDocument = new EventEmitter<void>();
  @Output() saveDocument = new EventEmitter<void>();
  @Output() exportDocument = new EventEmitter<string>();

  constructor(private fileService: FileService) {}

  // Listen for Ctrl+S keyboard shortcut
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault(); // Prevent browser's default save dialog
      this.saveDocumentLocally();
    }
  }

  onNewDocument() {
    this.newDocument.emit();
  }

  onOpenDocument() {
    this.openDocument.emit();
  }

  onSaveDocument() {
    this.saveDocument.emit();
  }

  saveDocumentLocally() {
    // Save document to local storage
    this.fileService.saveDocumentLocally(this.documentId).subscribe(
      (success: boolean) => {
        if (success) {
          this.showSaveNotification('Document saved locally');
        } else {
          this.showSaveNotification('Failed to save document', 'error');
        }
      }
    );
    
    // Also emit the save event for parent components
    this.saveDocument.emit();
  }

  private showSaveNotification(message: string, type: 'success' | 'error' = 'success') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  onExportPDF() {
    this.exportDocument.emit('pdf');
  }

  onExportWord() {
    this.exportDocument.emit('docx');
  }

  onPrint() {
    window.print();
  }

  openRecentDocuments() {
    // Navigate to file manager
    window.location.href = '/file/manager';
  }

  uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.fileService.uploadFile(file).subscribe(
          (response: any) => {
            console.log('File uploaded successfully:', response);
            // Handle successful upload
          },
          (error: any) => {
            console.error('File upload failed:', error);
          }
        );
      }
    };
    input.click();
  }
}