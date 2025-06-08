import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSubject.asObservable();

  toggleSidebar() {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  openSidebar() {
    this.isOpenSubject.next(true);
  }

  closeSidebar() {
    this.isOpenSubject.next(false);
  }
} 