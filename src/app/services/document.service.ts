import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  collaborators: string[];
  accessLevel: 'private' | 'shared' | 'public';
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private mockDocuments: Document[] = [
    {
      id: 'doc1',
      title: 'Welcome Document',
      content: 'Welcome to the collaborative editor!',
      lastModified: new Date(),
      collaborators: ['user1@example.com'],
      accessLevel: 'private'
    }
  ];

  constructor(private http: HttpClient) {}

  getDocument(id: string): Observable<Document> {
    // Mock API call
    const document = this.mockDocuments.find(doc => doc.id === id);
    return of(document || this.mockDocuments[0]).pipe(delay(100));
  }

  updateDocument(id: string, updates: Partial<Document>): Observable<Document> {
    // Mock API call
    const index = this.mockDocuments.findIndex(doc => doc.id === id);
    if (index > -1) {
      this.mockDocuments[index] = {
        ...this.mockDocuments[index],
        ...updates,
        lastModified: new Date()
      };
      return of(this.mockDocuments[index]).pipe(delay(100));
    }
    return of(this.mockDocuments[0]).pipe(delay(100));
  }

  shareDocument(id: string, email: string, accessLevel: string): Observable<boolean> {
    // Mock API call
    const document = this.mockDocuments.find(doc => doc.id === id);
    if (document && !document.collaborators.includes(email)) {
      document.collaborators.push(email);
      document.accessLevel = 'shared';
    }
    return of(true).pipe(delay(100));
  }

  exportDocument(id: string, format: 'pdf' | 'docx' | 'txt'): Observable<Blob> {
    // Mock API call - returns empty blob
    return of(new Blob([])).pipe(delay(100));
  }
} 