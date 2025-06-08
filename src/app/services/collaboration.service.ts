import { Injectable } from '@angular/core';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { Observable, Subject } from 'rxjs';

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    index: number;
    length: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider;
  private userPresence = new Subject<User[]>();

  constructor() {
    this.ydoc = new Y.Doc();
    this.provider = new WebsocketProvider(
      'ws://localhost:1234',
      'collaborative-document',
      this.ydoc
    );

    // Handle awareness updates
    this.provider.awareness.on('change', () => {
      const users: User[] = [];
      this.provider.awareness.getStates().forEach((state: any, clientId: number) => {
        if (state.user) {
          users.push({
            id: clientId.toString(),
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor
          });
        }
      });
      this.userPresence.next(users);
    });
  }

  getDocument(): Y.Doc {
    return this.ydoc;
  }

  getProvider(): WebsocketProvider {
    return this.provider;
  }

  getUserPresence(): Observable<User[]> {
    return this.userPresence.asObservable();
  }

  updateCursor(index: number, length: number = 0) {
    this.provider.awareness.setLocalStateField('cursor', {
      index,
      length
    });
  }

  destroy() {
    this.provider.destroy();
    this.ydoc.destroy();
  }
} 