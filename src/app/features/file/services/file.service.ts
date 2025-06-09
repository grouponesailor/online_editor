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

  constructor() {
    // Load saved documents from localStorage on service initialization
    this.loadSavedDocumentsFromStorage();
  }

  private loadSavedDocumentsFromStorage() {
    try {
      const savedDocsKey = 'saved_documents_list';
      const savedDocs = localStorage.getItem(savedDocsKey);
      if (savedDocs) {
        const parsedDocs = JSON.parse(savedDocs);
        // Merge saved documents with mock documents, avoiding duplicates
        parsedDocs.forEach((savedDoc: DocumentFile) => {
          const existingIndex = this.mockDocuments.findIndex(doc => doc.id === savedDoc.id);
          if (existingIndex > -1) {
            // Update existing document
            this.mockDocuments[existingIndex] = { ...this.mockDocuments[existingIndex], ...savedDoc };
          } else {
            // Add new document
            this.mockDocuments.unshift(savedDoc);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load saved documents from storage:', error);
    }
  }

  private saveMockDocumentsToStorage() {
    try {
      const savedDocsKey = 'saved_documents_list';
      // Only save user-created documents (not the initial mock ones)
      const userDocs = this.mockDocuments.filter(doc => 
        doc.id.startsWith('doc') && parseInt(doc.id.replace('doc', '')) > 1000000000000
      );
      localStorage.setItem(savedDocsKey, JSON.stringify(userDocs));
    } catch (error) {
      console.error('Failed to save documents to storage:', error);
    }
  }

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
      id: `new-${Date.now()}`,
      name: 'Untitled Document',
      lastModified: new Date(),
      size: 0,
      type: 'document',
      isShared: false,
      collaborators: []
    };
    this.mockDocuments.unshift(newDoc);
    this.saveMockDocumentsToStorage();
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
      this.saveMockDocumentsToStorage();
      return of(this.mockDocuments[index]).pipe(delay(200));
    }
    return throwError('Document not found');
  }

  deleteDocument(id: string): Observable<boolean> {
    const index = this.mockDocuments.findIndex(doc => doc.id === id);
    if (index > -1) {
      this.mockDocuments.splice(index, 1);
      this.saveMockDocumentsToStorage();
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
      this.saveMockDocumentsToStorage();
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
    this.saveMockDocumentsToStorage();
    return of(newDoc).pipe(delay(2000)); // Simulate upload time
  }

  shareDocument(id: string, email: string, permission: 'view' | 'edit'): Observable<boolean> {
    const document = this.mockDocuments.find(doc => doc.id === id);
    if (document) {
      if (!document.collaborators.includes(email)) {
        document.collaborators.push(email);
        document.isShared = true;
      }
      this.saveMockDocumentsToStorage();
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

  // Save document locally using localStorage and add/update in File Manager
  saveDocumentLocally(documentId: string, documentName?: string): Observable<boolean> {
    try {
      // Get current document content (this would normally come from the editor)
      const documentContent = this.getCurrentDocumentContent(documentId);
      
      // Create save data
      const saveData = {
        id: documentId,
        content: documentContent,
        lastSaved: new Date().toISOString(),
        version: this.getNextVersion(documentId)
      };

      // Save to localStorage
      const storageKey = `document_${documentId}_local`;
      localStorage.setItem(storageKey, JSON.stringify(saveData));

      // Add or update document in the File Manager list
      this.addOrUpdateDocumentInList(documentId, documentName);

      // Save to recent saves list
      this.addToRecentSaves(documentId);

      return of(true).pipe(delay(100));
    } catch (error) {
      console.error('Failed to save document locally:', error);
      return of(false).pipe(delay(100));
    }
  }

  private addOrUpdateDocumentInList(documentId: string, documentName?: string) {
    const existingIndex = this.mockDocuments.findIndex(doc => doc.id === documentId);
    
    if (existingIndex > -1) {
      // Update existing document
      this.mockDocuments[existingIndex].lastModified = new Date();
      if (documentName && documentName.trim()) {
        this.mockDocuments[existingIndex].name = documentName.trim();
      }
    } else {
      // Create new document entry
      const newDoc: DocumentFile = {
        id: documentId,
        name: documentName && documentName.trim() ? documentName.trim() : 'Untitled Document',
        lastModified: new Date(),
        size: this.estimateDocumentSize(documentId),
        type: 'document',
        isShared: false,
        collaborators: []
      };
      this.mockDocuments.unshift(newDoc);
    }
    
    // Save updated list to localStorage
    this.saveMockDocumentsToStorage();
  }

  private estimateDocumentSize(documentId: string): number {
    // Estimate document size based on content length
    const content = this.getCurrentDocumentContent(documentId);
    return content.length * 2; // Rough estimate: 2 bytes per character
  }

  // Method to update document name when it changes in the editor
  updateDocumentName(documentId: string, newName: string): Observable<boolean> {
    try {
      const existingIndex = this.mockDocuments.findIndex(doc => doc.id === documentId);
      
      if (existingIndex > -1) {
        this.mockDocuments[existingIndex].name = newName.trim() || 'Untitled Document';
        this.mockDocuments[existingIndex].lastModified = new Date();
        this.saveMockDocumentsToStorage();
      } else {
        // Create new document entry if it doesn't exist
        this.addOrUpdateDocumentInList(documentId, newName);
      }
      
      return of(true).pipe(delay(50));
    } catch (error) {
      console.error('Failed to update document name:', error);
      return of(false).pipe(delay(50));
    }
  }

  private getCurrentDocumentContent(documentId: string): string {
    // In a real implementation, this would get content from the editor
    // For now, return mock content
    return `Document content for ${documentId} - saved at ${new Date().toISOString()}`;
  }

  private getNextVersion(documentId: string): number {
    const storageKey = `document_${documentId}_local`;
    const existing = localStorage.getItem(storageKey);
    if (existing) {
      const data = JSON.parse(existing);
      return (data.version || 0) + 1;
    }
    return 1;
  }

  private addToRecentSaves(documentId: string) {
    const recentSavesKey = 'recent_local_saves';
    let recentSaves = [];
    
    try {
      const existing = localStorage.getItem(recentSavesKey);
      if (existing) {
        recentSaves = JSON.parse(existing);
      }
    } catch (error) {
      recentSaves = [];
    }

    // Add current document to the beginning, remove duplicates
    recentSaves = recentSaves.filter((id: string) => id !== documentId);
    recentSaves.unshift(documentId);
    
    // Keep only the last 10 saves
    recentSaves = recentSaves.slice(0, 10);
    
    localStorage.setItem(recentSavesKey, JSON.stringify(recentSaves));
  }

  // Get locally saved documents
  getLocallySavedDocuments(): Observable<any[]> {
    const savedDocs = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('document_') && key.endsWith('_local')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          savedDocs.push({
            documentId: data.id,
            lastSaved: data.lastSaved,
            version: data.version,
            storageKey: key
          });
        } catch (error) {
          console.error('Error parsing saved document:', error);
        }
      }
    }
    
    // Sort by last saved date
    savedDocs.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
    
    return of(savedDocs).pipe(delay(100));
  }

  // Load locally saved document
  loadLocalDocument(documentId: string): Observable<any> {
    const storageKey = `document_${documentId}_local`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return of(data).pipe(delay(100));
      } catch (error) {
        return throwError('Failed to parse saved document');
      }
    }
    
    return throwError('No local save found for this document');
  }
}