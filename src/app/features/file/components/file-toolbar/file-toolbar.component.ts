import { Component, Input, Output, EventEmitter } from '@angular/core';
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

  onNewDocument() {
    this.newDocument.emit();
  }

  onOpenDocument() {
    this.openDocument.emit();
  }

  onSaveDocument() {
    this.saveDocument.emit();
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