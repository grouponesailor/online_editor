import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ShareService, ShareSettings, SharedUser } from '../../../core/services/share.service';

@Component({
  selector: 'app-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.css']
})
export class ShareDialogComponent implements OnInit {
  @Input() documentId: string = '';
  @Input() documentName: string = 'Untitled Document';
  @Input() documentUrl: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() documentNameChange = new EventEmitter<string>();

  settings: ShareSettings = {
    access: 'private',
    allowEdit: false,
    allowComment: true,
    allowShare: false
  };

  sharedUsers: SharedUser[] = [];
  newUserEmail: string = '';
  newUserAccess: 'view' | 'comment' | 'edit' = 'view';
  currentShareLink: string = '';
  linkCopied: boolean = false;
  networkStatus: 'offline' | 'on-premise' | 'online' = 'offline';
  serverInfo: string = '';
  showQRCode: boolean = false;
  qrCodeData: string = '';

  constructor(private shareService: ShareService) {}

  ngOnInit() {
    this.loadSettings();
    this.loadSharedUsers();
    this.generateShareLink();
    this.checkNetworkStatus();
  }

  checkNetworkStatus() {
    this.shareService.getNetworkStatus().subscribe((status: 'offline' | 'on-premise' | 'online') => {
      this.networkStatus = status;
      if (status === 'on-premise' || status === 'online') {
        // Get server info for display
        this.serverInfo = window.location.hostname + ':1234';
      }
    });
  }

  generateShareLink() {
    this.shareService.generateShareLink(this.documentId)
      .subscribe((link: string) => {
        this.currentShareLink = link;
      });
  }

  updateDocumentName() {
    if (this.documentName.trim()) {
      this.documentNameChange.emit(this.documentName);
      // Also save the document name
      this.saveDocumentName();
    }
  }

  private saveDocumentName() {
    // Save document name to local storage and server if online
    localStorage.setItem(`doc-name-${this.documentId}`, this.documentName);
    
    if (this.networkStatus === 'online' || this.networkStatus === 'on-premise') {
      // Save to server
      const url = `/api/documents/${this.documentId}`;
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.documentName })
      }).catch(console.error);
    }
  }

  async loadSettings() {
    this.shareService.getSettings(this.documentId).subscribe(
      (settings: ShareSettings) => this.settings = settings,
      (error: any) => console.error('Failed to load settings:', error)
    );
  }

  async loadSharedUsers() {
    this.shareService.getSharedUsers(this.documentId).subscribe(
      (users: SharedUser[]) => this.sharedUsers = users,
      (error: any) => console.error('Failed to load shared users:', error)
    );
  }

  isValidEmailOrName(input: string): boolean {
    if (!input || input.trim().length === 0) return false;
    
    // Check if it's an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(input)) return true;
    
    // Check if it's a valid name (at least 2 characters)
    return input.trim().length >= 2;
  }

  async addUser() {
    if (!this.isValidEmailOrName(this.newUserEmail)) return;

    const input = this.newUserEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    let email = input;
    let name = input;
    
    if (!emailRegex.test(input)) {
      // If it's not an email, create a temporary email
      email = `${input.toLowerCase().replace(/\s+/g, '.')}@local.network`;
      name = input;
    }

    this.shareService.addUser(this.documentId, email, this.newUserAccess, name)
      .subscribe(
        (users: SharedUser[]) => {
          this.sharedUsers = users;
          this.newUserEmail = '';
          this.newUserAccess = 'view';
        },
        (error: any) => console.error('Failed to add user:', error)
      );
  }

  async removeUser(user: SharedUser) {
    this.shareService.removeUser(this.documentId, user.id)
      .subscribe(
        (users: SharedUser[]) => this.sharedUsers = users,
        (error: any) => console.error('Failed to remove user:', error)
      );
  }

  async updateUserAccess(user: SharedUser) {
    this.shareService.addUser(this.documentId, user.email, user.access, user.name)
      .subscribe(
        (users: SharedUser[]) => this.sharedUsers = users,
        (error: any) => console.error('Failed to update user access:', error)
      );
  }

  async updateSettings() {
    this.shareService.updateSettings(this.documentId, this.settings)
      .subscribe(
        (settings: ShareSettings) => {
          this.settings = settings;
          // Regenerate link when settings change
          this.generateShareLink();
        },
        (error: any) => console.error('Failed to update settings:', error)
      );
  }

  async copyLink() {
    if (!this.currentShareLink) return;
    
    try {
      await navigator.clipboard.writeText(this.currentShareLink);
      this.linkCopied = true;
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        this.linkCopied = false;
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = this.currentShareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.linkCopied = true;
      setTimeout(() => this.linkCopied = false, 3000);
    }
  }

  generateQRCode() {
    this.shareService.generateQRCode(this.documentId)
      .subscribe((qrCode: string) => {
        this.qrCodeData = qrCode;
        this.showQRCode = true;
      });
  }

  shareViaEmail() {
    const subject = `Shared Document: ${this.documentName}`;
    const body = `Hi,\n\nI'd like to share a document with you: "${this.documentName}"\n\nYou can access it here: ${this.currentShareLink}\n\nBest regards`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  }

  async saveChanges() {
    this.updateSettings();
    this.updateDocumentName();
    this.close.emit();
  }

  getNetworkStatusIcon() {
    switch (this.networkStatus) {
      case 'online':
        return 'fas fa-wifi text-green-500';
      case 'on-premise':
        return 'fas fa-server text-yellow-500';
      case 'offline':
        return 'fas fa-wifi-slash text-red-500';
      default:
        return 'fas fa-wifi text-gray-500';
    }
  }
} 