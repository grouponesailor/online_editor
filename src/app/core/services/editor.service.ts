import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Editor } from '@tiptap/core';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private editorSubject = new BehaviorSubject<Editor | null>(null);
  editor$ = this.editorSubject.asObservable();

  setEditor(editor: Editor | null) {
    this.editorSubject.next(editor);
  }

  getEditor(): Editor | null {
    return this.editorSubject.getValue();
  }
} 