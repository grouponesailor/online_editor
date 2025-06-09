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

interface VersionHistory {
  id: string;
  version: number;
  author: string;
  timestamp: Date;
  description: string;
  changes: string[];
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  status: string;
  cursorColor: string;
  lastSeen: Date;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-comments-sidebar',
  templateUrl: './comments-sidebar.component.html'
})
export class CommentsSidebarComponent {
  @Input() editor: Editor | null = null;
  @Input() documentId: string = '';

  activeTab: string = 'comments';
  showCollaboratorMenu: string | null = null;
  newCollaboratorEmail: string = '';

  tabs: Tab[] = [
    { id: 'comments', label: 'Comments', icon: 'fas fa-comments' },
    { id: 'history', label: 'History', icon: 'fas fa-history' },
    { id: 'collaborators', label: 'People', icon: 'fas fa-users' }
  ];

  comments: Comment[] = [
    {
      id: '1',
      text: 'This section needs more detail about the implementation.',
      author: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      replies: [
        {
          id: '2',
          text: 'I agree. I can add more technical specifications here.',
          author: {
            name: 'Jane Smith',
            email: 'jane@example.com'
          },
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        }
      ]
    },
    {
      id: '3',
      text: 'Great work on this document! The structure is very clear.',
      author: {
        name: 'Mike Johnson',
        email: 'mike@example.com'
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    }
  ];

  versionHistory: VersionHistory[] = [
    {
      id: 'v1',
      version: 3,
      author: 'Current User',
      timestamp: new Date(),
      description: 'Added new section on collaboration features',
      changes: ['Added collaboration section', 'Updated introduction', 'Fixed typos']
    },
    {
      id: 'v2',
      version: 2,
      author: 'Jane Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      description: 'Updated formatting and added images',
      changes: ['Improved formatting', 'Added screenshots', 'Updated table of contents']
    },
    {
      id: 'v3',
      version: 1,
      author: 'John Doe',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      description: 'Initial document creation',
      changes: ['Created document structure', 'Added initial content', 'Set up basic formatting']
    }
  ];

  activeCollaborators: Collaborator[] = [
    {
      id: '1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      isOnline: true,
      status: 'Editing paragraph 3',
      cursorColor: '#3B82F6',
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'viewer',
      isOnline: true,
      status: 'Viewing document',
      cursorColor: '#10B981',
      lastSeen: new Date()
    }
  ];

  allCollaborators: Collaborator[] = [
    {
      id: '1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      isOnline: true,
      status: 'Editing paragraph 3',
      cursorColor: '#3B82F6',
      lastSeen: new Date()
    },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'viewer',
      isOnline: true,
      status: 'Viewing document',
      cursorColor: '#10B981',
      lastSeen: new Date()
    },
    {
      id: '3',
      name: 'Sarah Wilson',
      email: 'sarah@example.com',
      role: 'editor',
      isOnline: false,
      status: 'Offline',
      cursorColor: '#F59E0B',
      lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000)
    },
    {
      id: '4',
      name: 'David Brown',
      email: 'david@example.com',
      role: 'viewer',
      isOnline: false,
      status: 'Offline',
      cursorColor: '#EF4444',
      lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  newCommentText: string = '';

  setActiveTab(tabId: string) {
    this.activeTab = tabId;
    this.showCollaboratorMenu = null; // Close any open menus
  }

  // Comments functionality
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
    const index = this.comments.findIndex(c => c.id === comment.id);
    if (index > -1) {
      this.comments.splice(index, 1);
    }
  }

  // Version history functionality
  viewVersion(version: VersionHistory) {
    console.log('View version:', version);
    // Implement version viewing functionality
  }

  restoreVersion(version: VersionHistory) {
    if (confirm(`Are you sure you want to restore to version ${version.version}? This will overwrite current changes.`)) {
      console.log('Restore version:', version);
      // Implement version restoration functionality
    }
  }

  // Collaborators functionality
  toggleCollaboratorMenu(collaboratorId: string) {
    this.showCollaboratorMenu = this.showCollaboratorMenu === collaboratorId ? null : collaboratorId;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addCollaborator() {
    if (!this.isValidEmail(this.newCollaboratorEmail)) return;

    // Check if collaborator already exists
    const exists = this.allCollaborators.some(c => c.email === this.newCollaboratorEmail);
    if (exists) {
      alert('This person is already a collaborator');
      return;
    }

    const newCollaborator: Collaborator = {
      id: Date.now().toString(),
      name: this.newCollaboratorEmail.split('@')[0], // Use email prefix as name
      email: this.newCollaboratorEmail,
      role: 'viewer',
      isOnline: false,
      status: 'Invited',
      cursorColor: this.generateRandomColor(),
      lastSeen: new Date()
    };

    this.allCollaborators.push(newCollaborator);
    this.newCollaboratorEmail = '';
    
    // Show success message
    console.log('Collaborator invited:', newCollaborator);
  }

  changeRole(collaborator: Collaborator) {
    const newRole = prompt(`Change role for ${collaborator.name}:\n\nCurrent role: ${collaborator.role}\n\nEnter new role (owner/editor/viewer):`, collaborator.role);
    if (newRole && ['owner', 'editor', 'viewer'].includes(newRole)) {
      collaborator.role = newRole as 'owner' | 'editor' | 'viewer';
      this.showCollaboratorMenu = null;
    }
  }

  sendMessage(collaborator: Collaborator) {
    const message = prompt(`Send a message to ${collaborator.name}:`);
    if (message) {
      console.log(`Message sent to ${collaborator.name}: ${message}`);
      this.showCollaboratorMenu = null;
    }
  }

  removeCollaborator(collaborator: Collaborator) {
    if (confirm(`Remove ${collaborator.name} from this document?`)) {
      const index = this.allCollaborators.findIndex(c => c.id === collaborator.id);
      if (index > -1) {
        this.allCollaborators.splice(index, 1);
      }
      
      // Also remove from active collaborators if present
      const activeIndex = this.activeCollaborators.findIndex(c => c.id === collaborator.id);
      if (activeIndex > -1) {
        this.activeCollaborators.splice(activeIndex, 1);
      }
      
      this.showCollaboratorMenu = null;
    }
  }

  private generateRandomColor(): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}