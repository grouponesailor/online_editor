import { Component, Input } from '@angular/core';
import { Editor } from '@tiptap/core';

interface Comment {
  id: string;
  text: string;
  author: {
    name: string;
    email: string;
    avatar?: string;
  };
  createdAt: Date;
  replies?: Comment[];
}

@Component({
  selector: 'app-comments-sidebar',
  templateUrl: './comments-sidebar.component.html'
})
export class CommentsSidebarComponent {
  @Input() editor: Editor | null = null;
  @Input() documentId: string = '';

  comments: Comment[] = [
    {
      id: '1',
      text: 'This is a sample comment.',
      author: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      createdAt: new Date(),
      replies: [
        {
          id: '2',
          text: 'This is a reply to the sample comment.',
          author: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          createdAt: new Date()
        }
      ]
    }
  ];

  newCommentText: string = '';

  addComment() {
    if (!this.newCommentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      text: this.newCommentText.trim(),
      author: {
        name: 'Current User',
        email: 'user@example.com'
      },
      createdAt: new Date()
    };

    this.comments.unshift(newComment);
    this.newCommentText = '';
  }

  replyToComment(comment: Comment) {
    // Implement reply functionality
    console.log('Reply to comment:', comment);
  }

  resolveComment(comment: Comment) {
    // Implement resolve functionality
    console.log('Resolve comment:', comment);
  }
} 