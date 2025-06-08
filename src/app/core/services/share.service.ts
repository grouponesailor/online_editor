import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { NetworkConfigService } from './network-config.service';

export interface ShareSettings {
  access: 'private' | 'restricted' | 'public';
  allowEdit: boolean;
  allowComment: boolean;
  allowShare: boolean;
  expirationDate?: string;
}

export interface SharedUser {
  id: string;
  email: string;
  name: string;
  access: 'view' | 'comment' | 'edit';
  avatar?: string;
  addedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  private offlineStorageKey = 'collaborative-doc-offline';
  private offlineData = new BehaviorSubject(this.loadOfflineData());

  constructor(private networkConfig: NetworkConfigService) {}

  private loadOfflineData() {
    try {
      const data = localStorage.getItem(this.offlineStorageKey);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          settings: new Map(Object.entries(parsed.settings || {})),
          users: new Map(Object.entries(parsed.users || {})),
          documents: new Map(Object.entries(parsed.documents || {}))
        };
      }
      return {
        settings: new Map(),
        users: new Map(),
        documents: new Map()
      };
    } catch {
      return {
        settings: new Map(),
        users: new Map(),
        documents: new Map()
      };
    }
  }

  private saveOfflineData(data: any) {
    try {
      localStorage.setItem(this.offlineStorageKey, JSON.stringify({
        settings: Object.fromEntries(data.settings),
        users: Object.fromEntries(data.users),
        documents: Object.fromEntries(data.documents)
      }));
      this.offlineData.next(data);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  getSettings(documentId: string): Observable<ShareSettings> {
    if (this.networkConfig.isOffline()) {
      return this.getOfflineSettings(documentId);
    }

    const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/settings`);
    return new Observable<ShareSettings>((subscriber) => {
      this.makeRequest<ShareSettings>(url)
        .then(result => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch(() => {
          this.getOfflineSettings(documentId).subscribe(
            (settings: ShareSettings) => {
              subscriber.next(settings);
              subscriber.complete();
            }
          );
        });
    });
  }

  private getOfflineSettings(documentId: string): Observable<ShareSettings> {
    const data = this.offlineData.value;
    const settings = data.settings.get(documentId) || {
      access: 'private',
      allowEdit: false,
      allowComment: true,
      allowShare: false
    };
    return of(settings);
  }

  updateSettings(documentId: string, settings: ShareSettings): Observable<ShareSettings> {
    // Always save offline first
    const data = this.offlineData.value;
    data.settings.set(documentId, settings);
    this.saveOfflineData(data);

    if (this.networkConfig.isOffline()) {
      return of(settings);
    }

    const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/settings`);
    return new Observable<ShareSettings>((subscriber) => {
      this.makeRequest<ShareSettings>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
        .then(result => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch(() => {
          subscriber.next(settings);
          subscriber.complete();
        });
    });
  }

  getSharedUsers(documentId: string): Observable<SharedUser[]> {
    if (this.networkConfig.isOffline()) {
      return this.getOfflineUsers(documentId);
    }

    const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/users`);
    return new Observable<SharedUser[]>((subscriber) => {
      this.makeRequest<SharedUser[]>(url)
        .then(result => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch(() => {
          this.getOfflineUsers(documentId).subscribe(
            (users: SharedUser[]) => {
              subscriber.next(users);
              subscriber.complete();
            }
          );
        });
    });
  }

  private getOfflineUsers(documentId: string): Observable<SharedUser[]> {
    const data = this.offlineData.value;
    const users = data.users.get(documentId) || [];
    return of(users);
  }

  addUser(documentId: string, email: string, access: 'view' | 'comment' | 'edit', name?: string): Observable<SharedUser[]> {
    // Always save offline first
    const data = this.offlineData.value;
    const users = data.users.get(documentId) || [];
    const existingUser = users.find((u: SharedUser) => u.email === email);

    if (existingUser) {
      existingUser.access = access;
      existingUser.name = name || existingUser.name;
    } else {
      users.push({
        id: Date.now().toString(),
        email,
        name: name || email.split('@')[0],
        access,
        avatar: undefined,
        addedAt: new Date().toISOString()
      });
    }

    data.users.set(documentId, users);
    this.saveOfflineData(data);

    if (this.networkConfig.isOffline()) {
      return of(users);
    }

    const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/users`);
    return new Observable<SharedUser[]>((subscriber) => {
      this.makeRequest<SharedUser[]>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, access, name })
      })
        .then(result => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch(() => {
          subscriber.next(users);
          subscriber.complete();
        });
    });
  }

  removeUser(documentId: string, userId: string): Observable<SharedUser[]> {
    // Always update offline first
    const data = this.offlineData.value;
    const users = data.users.get(documentId) || [];
    const filteredUsers = users.filter((u: SharedUser) => u.id !== userId);
    data.users.set(documentId, filteredUsers);
    this.saveOfflineData(data);

    if (this.networkConfig.isOffline()) {
      return of(filteredUsers);
    }

    const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/users/${userId}`);
    return new Observable<SharedUser[]>((subscriber) => {
      this.makeRequest<SharedUser[]>(url, {
        method: 'DELETE'
      })
        .then(result => {
          subscriber.next(result);
          subscriber.complete();
        })
        .catch(() => {
          subscriber.next(filteredUsers);
          subscriber.complete();
        });
    });
  }

  generateShareLink(documentId: string): Observable<string> {
    const shareLink = this.networkConfig.generateShareableLink(documentId);
    
    if (this.networkConfig.isOffline()) {
      return of(shareLink);
    }

    const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/link`);
    return new Observable<string>((subscriber) => {
      this.makeRequest<{link: string}>(url, {
        method: 'POST'
      })
        .then(response => {
          subscriber.next(response.link);
          subscriber.complete();
        })
        .catch(() => {
          subscriber.next(shareLink);
          subscriber.complete();
        });
    });
  }

  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Offline document management
  saveDocumentOffline(documentId: string, content: any): Observable<boolean> {
    try {
      const data = this.offlineData.value;
      data.documents.set(documentId, {
        id: documentId,
        content,
        lastModified: new Date().toISOString(),
        savedOffline: true
      });
      this.saveOfflineData(data);
      return of(true);
    } catch (error) {
      console.error('Failed to save document offline:', error);
      return of(false);
    }
  }

  getOfflineDocuments(): Observable<any[]> {
    const data = this.offlineData.value;
    const documents = Array.from(data.documents.values());
    return of(documents);
  }

  syncOfflineChanges(): Observable<boolean> {
    if (this.networkConfig.isOffline()) {
      return of(false);
    }

    // Sync offline changes when connected to on-premise or online server
    const data = this.offlineData.value;
    const promises: Promise<any>[] = [];

    // Sync settings
    data.settings.forEach((settings: ShareSettings, documentId: string) => {
      const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/settings`);
      promises.push(
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        }).catch(console.error)
      );
    });

    // Sync users
    data.users.forEach((users: SharedUser[], documentId: string) => {
      users.forEach(user => {
        const url = this.networkConfig.getRestApiUrl(`/share/${documentId}/users`);
        promises.push(
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
          }).catch(console.error)
        );
      });
    });

    return new Observable<boolean>((subscriber) => {
      Promise.all(promises).then(() => {
        subscriber.next(true);
        subscriber.complete();
      }).catch(() => {
        subscriber.next(false);
        subscriber.complete();
      });
    });
  }

  getNetworkStatus(): Observable<'offline' | 'on-premise' | 'online'> {
    return this.networkConfig.config$.pipe(
      map((config: any) => config.status)
    );
  }

  // Local network discovery
  discoverLocalServers(): Observable<string[]> {
    // This would be implemented to scan local network for other servers
    // For now, return empty array
    return of([]);
  }

  // QR Code generation for easy sharing
  generateQRCode(documentId: string): Observable<string> {
    const shareLink = this.networkConfig.generateShareableLink(documentId);
    
    // Generate a simple QR code representation using HTML/CSS
    const qrCodeSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="white"/>
        <rect x="10" y="10" width="180" height="180" fill="none" stroke="black" stroke-width="2"/>
        <text x="100" y="90" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
          QR Code
        </text>
        <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="10" fill="gray">
          Document: ${documentId}
        </text>
        <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="8" fill="gray">
          ${shareLink}
        </text>
        <rect x="20" y="20" width="20" height="20" fill="black"/>
        <rect x="160" y="20" width="20" height="20" fill="black"/>
        <rect x="20" y="160" width="20" height="20" fill="black"/>
        <rect x="50" y="50" width="10" height="10" fill="black"/>
        <rect x="70" y="50" width="10" height="10" fill="black"/>
        <rect x="90" y="50" width="10" height="10" fill="black"/>
        <rect x="110" y="50" width="10" height="10" fill="black"/>
        <rect x="130" y="50" width="10" height="10" fill="black"/>
        <rect x="150" y="50" width="10" height="10" fill="black"/>
        <rect x="50" y="70" width="10" height="10" fill="black"/>
        <rect x="90" y="70" width="10" height="10" fill="black"/>
        <rect x="130" y="70" width="10" height="10" fill="black"/>
        <rect x="170" y="70" width="10" height="10" fill="black"/>
      </svg>
    `;
    
    return of(qrCodeSvg);
  }
}