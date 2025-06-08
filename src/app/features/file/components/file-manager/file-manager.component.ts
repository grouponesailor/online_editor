import { Component, OnInit } from '@angular/core';
import { FileService } from '../../services/file.service';

export interface DocumentFile {
  id: string;
  name: string;
  lastModified: Date;
  size: number;
  type: 'document' | 'template';
  isShared: boolean;
  collaborators: string[];
}

@Component({
  selector: 'app-file-manager',
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.css']
})
export class FileManagerComponent implements OnInit {
  documents: DocumentFile[] = [];
  recentDocuments: DocumentFile[] = [];
  templates: DocumentFile[] = [];
  searchQuery: string = '';
  selectedView: 'grid' | 'list' = 'grid';
  sortBy: 'name' | 'date' | 'size' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(private fileService: FileService) {}

  ngOnInit() {
    this.loadDocuments();
    this.loadRecentDocuments();
    this.loadTemplates();
  }

  loadDocuments() {
    this.fileService.getDocuments().subscribe(
      (documents: DocumentFile[]) => {
        this.documents = documents;
      }
    );
  }

  loadRecentDocuments() {
    this.fileService.getRecentDocuments().subscribe(
      (documents: DocumentFile[]) => {
        this.recentDocuments = documents.slice(0, 5);
      }
    );
  }

  loadTemplates() {
    this.fileService.getTemplates().subscribe(
      (templates: DocumentFile[]) => {
        this.templates = templates;
      }
    );
  }

  createNewDocument() {
    this.fileService.createNewDocument().subscribe(
      (document: DocumentFile) => {
        // Navigate to the new document
        window.location.href = `/documents/${document.id}`;
      }
    );
  }

  openDocument(document: DocumentFile) {
    window.location.href = `/documents/${document.id}`;
  }

  deleteDocument(document: DocumentFile) {
    if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
      this.fileService.deleteDocument(document.id).subscribe(
        () => {
          this.loadDocuments();
        }
      );
    }
  }

  duplicateDocument(document: DocumentFile) {
    this.fileService.duplicateDocument(document.id).subscribe(
      (newDocument: DocumentFile) => {
        this.loadDocuments();
      }
    );
  }

  shareDocument(document: DocumentFile) {
    // Open share dialog
    console.log('Share document:', document);
  }

  exportDocument(document: DocumentFile, format: 'pdf' | 'docx' | 'txt') {
    this.fileService.exportDocument(document.id, format).subscribe(
      (blob: Blob) => {
        // Download the file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.name}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    );
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.fileService.searchDocuments(this.searchQuery).subscribe(
        (documents: DocumentFile[]) => {
          this.documents = documents;
        }
      );
    } else {
      this.loadDocuments();
    }
  }

  sortDocuments() {
    this.documents.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  getFilteredDocuments(): DocumentFile[] {
    return this.documents.filter(doc => 
      doc.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}