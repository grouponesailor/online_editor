import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { DocumentFile } from '../components/file-manager/file-manager.component';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private mockDocuments: DocumentFile[] = [
    {
      id: 'doc1',
      name: 'Body Building Guide.docx',
      lastModified: new Date(2024, 0, 15),
      size: 2048576, // 2MB
      type: 'document',
      isShared: true,
      collaborators: ['user1@example.com', 'user2@example.com']
    },
    {
      id: 'doc2',
      name: 'Workout Plan Template.docx',
      lastModified: new Date(2024, 0, 10),
      size: 1024000, // 1MB
      type: 'template',
      isShared: false,
      collaborators: []
    },
    {
      id: 'doc3',
      name: 'Nutrition Guidelines.docx',
      lastModified: new Date(2024, 0, 8),
      size: 1536000, // 1.5MB
      type: 'document',
      isShared: true,
      collaborators: ['nutritionist@example.com']
    },
    {
      id: 'doc4',
      name: 'Exercise Database.docx',
      lastModified: new Date(2024, 0, 5),
      size: 3072000, // 3MB
      type: 'document',
      isShared: false,
      collaborators: []
    },
    {
      id: 'doc5',
      name: 'Progress Tracking Sheet.docx',
      lastModified: new Date(2024, 0, 3),
      size: 512000, // 512KB
      type: 'template',
      isShared: true,
      collaborators: ['trainer@example.com']
    }
  ];

  constructor() {}

  getDocuments(): Observable<DocumentFile[]> {
    return of(this.mockDocuments.filter(doc => doc.type === 'document')).pipe(delay(300));
  }

  getRecentDocuments(): Observable<DocumentFile[]> {
    const recent = [...this.mockDocuments]
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, 5);
    return of(recent).pipe(delay(200));
  }

  getTemplates(): Observable<DocumentFile[]> {
    return of(this.mockDocuments.filter(doc => doc.type === 'template')).pipe(delay(250));
  }

  searchDocuments(query: string): Observable<DocumentFile[]> {
    const filtered = this.mockDocuments.filter(doc =>
      doc.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filtered).pipe(delay(400));
  }

  createNewDocument(): Observable<DocumentFile> {
    const newDoc: DocumentFile = {
      id: `doc${Date.now()}`,
      name: 'Untitled Document',
      lastModified: new Date(),
      size: 0,
      type: 'document',
      isShared: false,
      collaborators: []
    };
    this.mockDocuments.unshift(newDoc);
    return of(newDoc).pipe(delay(200));
  }

  getDocument(id: string): Observable<DocumentFile | null> {
    const document = this.mockDocuments.find(doc => doc.id === id);
    return of(document || null).pipe(delay(150));
  }

  updateDocument(id: string, updates: Partial<DocumentFile>): Observable<DocumentFile> {
    const index = this.mockDocuments.findIndex(doc => doc.id === id);
    if (index > -1) {
      this.mockDocuments[index] = {
        ...this.mockDocuments[index],
        ...updates,
        lastModified: new Date()
      };
      return of(this.mockDocuments[index]).pipe(delay(200));
    }
    return throwError('Document not found');
  }

  deleteDocument(id: string): Observable<boolean> {
    const index = this.mockDocuments.findIndex(doc => doc.id === id);
    if (index > -1) {
      this.mockDocuments.splice(index, 1);
      return of(true).pipe(delay(300));
    }
    return throwError('Document not found');
  }

  duplicateDocument(id: string): Observable<DocumentFile> {
    const original = this.mockDocuments.find(doc => doc.id === id);
    if (original) {
      const duplicate: DocumentFile = {
        ...original,
        id: `doc${Date.now()}`,
        name: `${original.name} (Copy)`,
        lastModified: new Date(),
        isShared: false,
        collaborators: []
      };
      this.mockDocuments.unshift(duplicate);
      return of(duplicate).pipe(delay(400));
    }
    return throwError('Document not found');
  }

  exportDocument(id: string, format: 'pdf' | 'docx' | 'txt'): Observable<Blob> {
    // Mock export functionality
    const content = `Exported document content in ${format} format`;
    const blob = new Blob([content], { 
      type: format === 'pdf' ? 'application/pdf' : 
           format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
           'text/plain'
    });
    return of(blob).pipe(delay(1000));
  }

  uploadFile(file: File): Observable<DocumentFile> {
    // Mock file upload
    const newDoc: DocumentFile = {
      id: `doc${Date.now()}`,
      name: file.name,
      lastModified: new Date(),
      size: file.size,
      type: 'document',
      isShared: false,
      collaborators: []
    };
    this.mockDocuments.unshift(newDoc);
    return of(newDoc).pipe(delay(2000)); // Simulate upload time
  }

  shareDocument(id: string, email: string, permission: 'view' | 'edit'): Observable<boolean> {
    const document = this.mockDocuments.find(doc => doc.id === id);
    if (document) {
      if (!document.collaborators.includes(email)) {
        document.collaborators.push(email);
        document.isShared = true;
      }
      return of(true).pipe(delay(500));
    }
    return throwError('Document not found');
  }

  getDocumentHistory(id: string): Observable<any[]> {
    // Mock document history/versions
    const history = [
      {
        id: 'v1',
        timestamp: new Date(2024, 0, 15, 10, 30),
        author: 'Current User',
        changes: 'Initial document creation'
      },
      {
        id: 'v2',
        timestamp: new Date(2024, 0, 15, 14, 45),
        author: 'John Doe',
        changes: 'Added exercise descriptions'
      },
      {
        id: 'v3',
        timestamp: new Date(2024, 0, 16, 9, 15),
        author: 'Current User',
        changes: 'Updated nutrition guidelines'
      }
    ];
    return of(history).pipe(delay(300));
  }
}