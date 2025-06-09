import { Component, Input } from '@angular/core';
import { Editor } from '@tiptap/core';
import { AiService } from '../../services/ai.service';

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
  newCommentText: string = '';
  
  // AI functionality properties - explicitly declared
  isSummarizing: boolean = false;
  aiSummary: string | null = null;

  constructor(private aiService: AiService) {}

  tabs: Tab[] = [
    { id: 'comments', label: 'Comments', icon: 'fas fa-comments' },
    { id: 'history', label: 'History', icon: 'fas fa-history' },
    { id: 'collaborators', label: 'AI', icon: 'fas fa-robot' }
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

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.showCollaboratorMenu = null; // Close any open menus
  }

  // Comments functionality
  addComment(): void {
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

  replyToComment(comment: Comment): void {
    // Implement reply functionality
    console.log('Reply to comment:', comment);
  }

  resolveComment(comment: Comment): void {
    // Implement resolve functionality
    const index = this.comments.findIndex(c => c.id === comment.id);
    if (index > -1) {
      this.comments.splice(index, 1);
    }
  }

  // Version history functionality
  viewVersion(version: VersionHistory): void {
    console.log('View version:', version);
    // Implement version viewing functionality
  }

  restoreVersion(version: VersionHistory): void {
    if (confirm(`Are you sure you want to restore to version ${version.version}? This will overwrite current changes.`)) {
      console.log('Restore version:', version);
      // Implement version restoration functionality
    }
  }

  // Collaborators functionality
  toggleCollaboratorMenu(collaboratorId: string): void {
    this.showCollaboratorMenu = this.showCollaboratorMenu === collaboratorId ? null : collaboratorId;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addCollaborator(): void {
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

  changeRole(collaborator: Collaborator): void {
    const newRole = prompt(`Change role for ${collaborator.name}:\n\nCurrent role: ${collaborator.role}\n\nEnter new role (owner/editor/viewer):`, collaborator.role);
    if (newRole && ['owner', 'editor', 'viewer'].includes(newRole)) {
      collaborator.role = newRole as 'owner' | 'editor' | 'viewer';
      this.showCollaboratorMenu = null;
    }
  }

  sendMessage(collaborator: Collaborator): void {
    const message = prompt(`Send a message to ${collaborator.name}:`);
    if (message) {
      console.log(`Message sent to ${collaborator.name}: ${message}`);
      this.showCollaboratorMenu = null;
    }
  }

  removeCollaborator(collaborator: Collaborator): void {
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

  // AI functionality methods - explicitly declared with proper return types
  async summarizeDocument(): Promise<void> {
    if (!this.editor) {
      console.warn('No editor available for summarization');
      return;
    }

    this.isSummarizing = true;
    this.aiSummary = null;

    try {
      // Get document content
      const documentText = this.editor.getText();
      
      if (!documentText.trim()) {
        this.aiSummary = 'The document appears to be empty. Please add some content to generate a summary.';
        return;
      }

      console.log('🚀 Starting document summarization...');
      
      // Use the AI service to get real summary from Hugging Face
      this.aiService.summarizeText(documentText).subscribe({
        next: (summary: string) => {
          console.log('✅ Summarization completed successfully');
          this.aiSummary = summary;
          this.isSummarizing = false;
        },
        error: (error: any) => {
          console.error('❌ Summarization failed:', error);
          this.aiSummary = 'Sorry, there was an error generating the summary. Please try again later.';
          this.isSummarizing = false;
        }
      });
      
    } catch (error) {
      console.error('Error generating summary:', error);
      this.aiSummary = 'Sorry, there was an error generating the summary. Please try again later.';
      this.isSummarizing = false;
    }
  }

  private generateMockSummary(text: string): string {
    const wordCount = text.trim().split(/\s+/).length;
    const paragraphCount = text.split('\n\n').filter(p => p.trim()).length;
    
    // Create a basic summary based on content analysis
    const summaries = [
      `This document contains ${wordCount} words across ${paragraphCount} paragraphs. The content appears to focus on collaborative document editing and real-time features. Key topics include user interface design, technical implementation, and feature documentation.`,
      
      `The document discusses a comprehensive collaborative editing platform with ${wordCount} words of content. Main themes include real-time collaboration, document management, and user experience optimization across ${paragraphCount} sections.`,
      
      `This ${wordCount}-word document outlines features and functionality for a modern document editor. The content spans ${paragraphCount} main sections covering collaboration tools, editing capabilities, and technical specifications.`,
      
      `The document presents a detailed overview of collaborative document editing features in ${wordCount} words. Key areas covered include real-time synchronization, user management, and advanced editing tools across ${paragraphCount} organized sections.`
    ];
    
    // Select a random summary template
    const baseSummary = summaries[Math.floor(Math.random() * summaries.length)];
    
    // Add content-specific insights if certain keywords are found
    const insights = [];
    if (text.toLowerCase().includes('collaboration')) {
      insights.push('The document emphasizes collaborative features and team-based editing.');
    }
    if (text.toLowerCase().includes('real-time')) {
      insights.push('Real-time synchronization is a central theme throughout the content.');
    }
    if (text.toLowerCase().includes('user') || text.toLowerCase().includes('interface')) {
      insights.push('User experience and interface design are important considerations.');
    }
    if (text.toLowerCase().includes('feature') || text.toLowerCase().includes('functionality')) {
      insights.push('The document details various features and their implementation.');
    }
    
    let finalSummary = baseSummary;
    if (insights.length > 0) {
      finalSummary += ' ' + insights.join(' ');
    }
    
    return finalSummary;
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // Show temporary success message
      console.log('Summary copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  insertSummaryIntoDocument(): void {
    if (!this.editor || !this.aiSummary) return;

    // Insert the summary at the current cursor position
    this.editor.chain()
      .focus()
      .insertContent(`\n\n**AI Summary:**\n${this.aiSummary}\n\n`)
      .run();

    // Close the summary
    this.aiSummary = null;
  }
}