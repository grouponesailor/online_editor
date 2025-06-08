import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Editor } from '@tiptap/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommentsService } from '../../services/comments.service';

interface Comment {
  id: string;
  text: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: Date;
  resolved?: boolean;
  replies?: Comment[];
  selection?: {
    from: number;
    to: number;
    text: string;
  };
}

@Component({
  selector: 'app-comments-sidebar',
  templateUrl: './comments-sidebar.component.html',
  styleUrls: ['./comments-sidebar.component.css']
})
export class CommentsSidebarComponent implements OnInit, OnDestroy {
  @Input() editor: Editor | null = null;
  @Input() documentId: string = '';

  comments: Comment[] = [];
  newCommentText: string = '';
  replyingTo: Comment | null = null;
  editingComment: Comment | null = null;
  selectedText: string = '';
  isOpen$ = this.commentsService.isOpen$;

  private destroy$ = new Subject<void>();
  private currentUser = {
    name: 'Current User',
    email: 'user@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Current+User'
  };

  constructor(private commentsService: CommentsService) {
    // Load comments from localStorage for demo
    const savedComments = localStorage.getItem(`doc-comments-${this.documentId}`);
    if (savedComments) {
      this.comments = JSON.parse(savedComments);
    }
  }

  ngOnInit() {
    if (this.editor) {
      this.editor.on('selectionUpdate', ({ editor }) => {
        const { from, to } = editor.state.selection;
        const text = editor.state.doc.textBetween(from, to, ' ');
        this.selectedText = text;
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.commentsService.toggleSidebar();
  }

  closeSidebar() {
    this.commentsService.closeSidebar();
  }

  addComment(event?: KeyboardEvent) {
    if (event) {
      if (!event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        this.submitComment();
      }
      return;
    }
    this.submitComment();
  }

  private submitComment() {
    if (!this.newCommentText.trim()) return;

    const selection = this.editor?.state.selection;
    let selectionInfo = undefined;

    if (selection && !selection.empty) {
      const { from, to } = selection;
      selectionInfo = {
        from,
        to,
        text: this.editor?.state.doc.textBetween(from, to, ' ') || ''
      };
    }

    const newComment: Comment = {
      id: Date.now().toString(),
      text: this.newCommentText.trim(),
      author: this.currentUser,
      createdAt: new Date(),
      selection: selectionInfo,
      replies: []
    };

    this.comments.unshift(newComment);
    this.newCommentText = '';
    this.saveComments();
  }

  replyToComment(comment: Comment) {
    if (!this.replyingTo || this.replyingTo.id !== comment.id) {
      this.replyingTo = comment;
      this.editingComment = null;
    } else {
      this.replyingTo = null;
    }
  }

  submitReply(comment: Comment, replyText: string) {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: Date.now().toString(),
      text: replyText.trim(),
      author: this.currentUser,
      createdAt: new Date()
    };

    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push(reply);
    this.replyingTo = null;
    this.saveComments();
  }

  editComment(comment: Comment) {
    this.editingComment = comment;
    this.replyingTo = null;
  }

  updateComment(comment: Comment, newText: string) {
    if (!newText.trim()) return;
    comment.text = newText.trim();
    this.editingComment = null;
    this.saveComments();
  }

  deleteComment(commentId: string) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.comments = this.comments.filter(c => c.id !== commentId);
      this.saveComments();
    }
  }

  resolveComment(comment: Comment) {
    comment.resolved = !comment.resolved;
    this.saveComments();
  }

  highlightCommentSelection(comment: Comment) {
    if (!this.editor || !comment.selection) return;

    const { from, to } = comment.selection;
    this.editor.commands.setTextSelection({ from, to });
  }

  private saveComments() {
    localStorage.setItem(`doc-comments-${this.documentId}`, JSON.stringify(this.comments));
  }

  getCommentDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
} 