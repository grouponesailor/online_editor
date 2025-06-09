import { Component, Input } from '@angular/core';
import { Editor } from '@tiptap/core';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface TranslationStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

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
  content: string;
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

  // Version history service
  private versionHistoryService = {
    getVersions: (docId: string) => this.getStoredVersions(docId),
    saveVersion: (docId: string, content: string, description?: string) => this.saveNewVersion(docId, content, description),
    restoreVersion: (docId: string, versionId: string) => this.restoreVersionContent(docId, versionId)
  };

  activeTab: string = 'comments';
  showCollaboratorMenu: string | null = null;
  newCollaboratorEmail: string = '';
  showVersionMenu: string | null = null;

  // AI Tab properties
  sourceLanguage: string = 'auto';
  targetLanguage: string = 'es';
  preserveFormatting: boolean = true;
  translateInPlace: boolean = false;
  isTranslating: boolean = false;
  translationStatus: TranslationStatus | null = null;
  aiQuestion: string = '';
  aiResponse: string = '';
  isProcessingAI: boolean = false;

  supportedLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文(简体)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文(繁體)' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'ro', name: 'Romanian', nativeName: 'Română' },
    { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
    { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
    { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
    { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
    { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
    { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
    { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
    { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
    { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
    { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
    { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
    { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
    { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
    { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
    { code: 'eu', name: 'Basque', nativeName: 'Euskera' },
    { code: 'ca', name: 'Catalan', nativeName: 'Català' },
    { code: 'gl', name: 'Galician', nativeName: 'Galego' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
    { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
    { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
    { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
    { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
    { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
    { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
    { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргыз' },
    { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek' },
    { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ' },
    { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
    { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
    { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
    { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
    { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
    { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
    { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
    { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी' },
    { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
    { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },
    { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
    { code: 'sn', name: 'Shona', nativeName: 'Shona' },
    { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
    { code: 'tn', name: 'Setswana', nativeName: 'Setswana' },
    { code: 'ts', name: 'Xitsonga', nativeName: 'Xitsonga' },
    { code: 've', name: 'Tshivenda', nativeName: 'Tshivenda' },
    { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
    { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
    { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
    { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
    { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
    { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi' },
    { code: 'lg', name: 'Luganda', nativeName: 'Luganda' },
    { code: 'ak', name: 'Akan', nativeName: 'Akan' },
    { code: 'tw', name: 'Twi', nativeName: 'Twi' },
    { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
    { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
    { code: 'ff', name: 'Fulfulde', nativeName: 'Fulfulde' },
    { code: 'wo', name: 'Wolof', nativeName: 'Wolof' },
    { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan' },
    { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe' },
    { code: 'kri', name: 'Krio', nativeName: 'Krio' },
    { code: 'gom', name: 'Goan Konkani', nativeName: 'गोंयची कोंकणी' },
    { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
    { code: 'mni-Mtei', name: 'Meiteilon (Manipuri)', nativeName: 'ꯃꯩꯇꯩꯂꯣꯟ' },
    { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng' },
    { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'کوردی' },
    { code: 'ku', name: 'Kurdish (Kurmanji)', nativeName: 'Kurdî' },
    { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
    { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە' }
  ];

  tabs: Tab[] = [
    { id: 'comments', label: 'Comments', icon: 'fas fa-comments' },
    { id: 'history', label: 'History', icon: 'fas fa-history' },
    { id: 'ai', label: 'AI', icon: 'fas fa-robot' }
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
    // Will be loaded from localStorage
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

  saveManualVersion() {
    const description = prompt('Enter a description for this version (optional):');
    if (description !== null) { // User didn't cancel
      const version = this.saveVersion(description || 'Manual save');
      if (version) {
        alert(`Version ${version.version} saved successfully!`);
      }
    }
  }

  getVersionSize(version: VersionHistory): string {
    if (!version.content) return '0 KB';
    const bytes = new Blob([version.content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  ngOnInit() {
    // Load version history when component initializes
    if (this.documentId) {
      this.loadVersionHistory();
    }
    
    // Listen for editor changes to auto-save versions
    if (this.editor) {
      this.setupAutoVersioning();
    }
  }

  ngOnChanges() {
    // Reload version history when document ID changes
    if (this.documentId) {
      this.loadVersionHistory();
    }
    
    if (this.editor) {
      this.setupAutoVersioning();
    }
  }

  private setupAutoVersioning() {
    if (!this.editor) return;

    // Listen for significant changes (debounced)
    let saveTimeout: any;
    this.editor.on('update', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        this.autoSaveVersion();
      }, 30000); // Auto-save version every 30 seconds of inactivity
    });
  }

  private loadVersionHistory() {
    if (this.documentId) {
      this.versionHistory = this.getStoredVersions(this.documentId);
    } else {
      this.versionHistory = [];
    }
  }

  private getStoredVersions(docId: string): VersionHistory[] {
    if (!docId) return [];
    
    try {
      const storageKey = `doc-versions-${docId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const versions = JSON.parse(stored);
        return versions.map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading version history:', error);
    }
    
    // Return empty array if no versions exist yet
    return [];
  }

  private saveNewVersion(docId: string, content: string, description?: string): VersionHistory {
    if (!docId) {
      console.error('Cannot save version: no document ID provided');
      return {} as VersionHistory;
    }
    
    const versions = this.getStoredVersions(docId);
    const nextVersion = Math.max(...versions.map(v => v.version), 0) + 1;
    
    const newVersion: VersionHistory = {
      id: `v-${Date.now()}`,
      version: nextVersion,
      author: 'Current User', // In a real app, get from auth service
      timestamp: new Date(),
      description: description || `Auto-save version ${nextVersion}`,
      changes: this.detectChanges(versions[0]?.content || '', content),
      content: content
    };

    // Add to beginning of array (newest first)
    versions.unshift(newVersion);
    
    // Keep only last 50 versions to prevent storage bloat
    const trimmedVersions = versions.slice(0, 50);
    
    // Save to localStorage
    try {
      const storageKey = `doc-versions-${docId}`;
      localStorage.setItem(storageKey, JSON.stringify(trimmedVersions));
      
      // Update component state
      this.versionHistory = trimmedVersions;
      
      console.log(`Saved version ${nextVersion} for document ${docId}`);
    } catch (error) {
      console.error('Error saving version:', error);
    }

    return newVersion;
  }

  private detectChanges(oldContent: string, newContent: string): string[] {
    const changes: string[] = [];
    
    // Simple change detection
    const oldLength = oldContent.length;
    const newLength = newContent.length;
    
    if (newLength > oldLength) {
      const diff = newLength - oldLength;
      changes.push(`Added ${diff} characters`);
    } else if (newLength < oldLength) {
      const diff = oldLength - newLength;
      changes.push(`Removed ${diff} characters`);
    }
    
    // Count words
    const oldWords = oldContent.split(/\s+/).filter(w => w.length > 0).length;
    const newWords = newContent.split(/\s+/).filter(w => w.length > 0).length;
    
    if (newWords !== oldWords) {
      const wordDiff = newWords - oldWords;
      if (wordDiff > 0) {
        changes.push(`Added ${wordDiff} words`);
      } else {
        changes.push(`Removed ${Math.abs(wordDiff)} words`);
      }
    }
    
    // Detect structural changes
    const oldHeadings = (oldContent.match(/<h[1-6]/g) || []).length;
    const newHeadings = (newContent.match(/<h[1-6]/g) || []).length;
    
    if (newHeadings !== oldHeadings) {
      changes.push(`Modified headings`);
    }
    
    const oldImages = (oldContent.match(/<img/g) || []).length;
    const newImages = (newContent.match(/<img/g) || []).length;
    
    if (newImages !== oldImages) {
      changes.push(`Modified images`);
    }
    
    const oldTables = (oldContent.match(/<table/g) || []).length;
    const newTables = (newContent.match(/<table/g) || []).length;
    
    if (newTables !== oldTables) {
      changes.push(`Modified tables`);
    }
    
    return changes.length > 0 ? changes : ['Content modified'];
  }

  private autoSaveVersion() {
    if (!this.editor) return;
    
    // Don't auto-save if we don't have a document ID
    if (!this.documentId) return;
    
    const content = this.editor.getHTML();
    const currentVersions = this.getStoredVersions(this.documentId);
    
    // Only save if content has actually changed
    if (currentVersions.length > 0 && currentVersions[0].content === content) {
      return;
    }
    
    this.saveNewVersion(this.documentId, content, 'Auto-save');
  }

  // Public method to manually save a version (called from save operations)
  public saveVersion(description?: string) {
    if (!this.editor || !this.documentId) return;
    
    const content = this.editor.getHTML();
    return this.saveNewVersion(this.documentId, content, description || 'Manual save');
  }

  private restoreVersionContent(docId: string, versionId: string): boolean {
    if (!docId || !versionId) return false;
    
    const versions = this.getStoredVersions(docId);
    const version = versions.find(v => v.id === versionId);
    
    if (!version || !this.editor) {
      return false;
    }
    
    // Set the editor content to the version content
    this.editor.commands.setContent(version.content);
    
    // Save this as a new version (restoration)
    this.saveNewVersion(docId, version.content, `Restored to version ${version.version}`);
    
    return true;
  }

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
    
    // Show version content in a modal or preview
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">Version ${version.version} Preview</h2>
          <button class="text-gray-500 hover:text-gray-700 close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-4 border-b bg-gray-50">
          <div class="flex items-center gap-4 text-sm text-gray-600">
            <span><i class="fas fa-user mr-1"></i> ${version.author}</span>
            <span><i class="fas fa-clock mr-1"></i> ${version.timestamp.toLocaleString()}</span>
            <span><i class="fas fa-tag mr-1"></i> ${version.description}</span>
          </div>
          <div class="mt-2">
            <strong>Changes:</strong> ${version.changes.join(', ')}
          </div>
        </div>
        <div class="p-4 overflow-y-auto max-h-96">
          <div class="prose max-w-none">${version.content || 'No content available'}</div>
        </div>
        <div class="p-4 border-t flex justify-end gap-2">
          <button class="px-4 py-2 border rounded hover:bg-gray-50 close-btn">Close</button>
          <button class="px-4 py-2 bg-[#6200EE] text-white rounded hover:bg-[#5000CC] restore-btn">
            Restore This Version
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
    
    modal.querySelector('.restore-btn')?.addEventListener('click', () => {
      this.restoreVersion(version);
      document.body.removeChild(modal);
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  restoreVersion(version: VersionHistory) {
    if (confirm(`Are you sure you want to restore to version ${version.version}? This will overwrite current changes.`)) {
      const success = this.restoreVersionContent(this.documentId, version.id);
      if (success) {
        alert(`Successfully restored to version ${version.version}`);
      } else {
        alert('Failed to restore version. Please try again.');
      }
    }
  }

  deleteVersion(version: VersionHistory) {
    if (!this.documentId) {
      alert('Cannot delete version: no document ID');
      return;
    }
    
    if (version.version === 1) {
      alert('Cannot delete the initial version');
      return;
    }
    
    if (confirm(`Are you sure you want to delete version ${version.version}?`)) {
      const versions = this.getStoredVersions(this.documentId);
      const filteredVersions = versions.filter(v => v.id !== version.id);
      
      try {
        const storageKey = `doc-versions-${this.documentId}`;
        localStorage.setItem(storageKey, JSON.stringify(filteredVersions));
        this.versionHistory = filteredVersions;
        console.log(`Deleted version ${version.version}`);
      } catch (error) {
        console.error('Error deleting version:', error);
        alert('Failed to delete version');
      }
    }
  }

  compareVersions(version1: VersionHistory, version2: VersionHistory) {
    // Simple comparison - in a real app, you'd use a proper diff library
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div class="p-4 border-b flex justify-between items-center">
          <h2 class="text-xl font-semibold">Compare Versions ${version1.version} & ${version2.version}</h2>
          <button class="text-gray-500 hover:text-gray-700 close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-4 overflow-y-auto max-h-96">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold mb-2">Version ${version1.version}</h3>
              <div class="prose max-w-none text-sm border rounded p-3 bg-red-50">
                ${version1.content || 'No content'}
              </div>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Version ${version2.version}</h3>
              <div class="prose max-w-none text-sm border rounded p-3 bg-green-50">
                ${version2.content || 'No content'}
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 border-t flex justify-end">
          <button class="px-4 py-2 border rounded hover:bg-gray-50 close-btn">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
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

  // Translation functionality
  async translateDocument() {
    if (!this.editor || !this.targetLanguage) return;

    this.isTranslating = true;
    this.translationStatus = {
      type: 'info',
      message: 'Starting translation...'
    };

    try {
      // Get the document content
      const content = this.getDocumentContent();
      
      if (!content.trim()) {
        this.translationStatus = {
          type: 'error',
          message: 'No content to translate'
        };
        this.isTranslating = false;
        return;
      }

      // Simulate translation API call
      const translatedContent = await this.translateText(content, this.sourceLanguage, this.targetLanguage);
      
      if (this.translateInPlace) {
        // Replace the content in the editor
        if (this.preserveFormatting) {
          // Try to preserve formatting by replacing text content while keeping structure
          this.replaceTextPreservingFormat(translatedContent);
        } else {
          // Simple replacement
          this.replaceDocumentContent(translatedContent);
        }
      } else {
        // Insert translated content at the end
        this.editor.chain()
          .focus()
          .setTextSelection(this.editor.state.doc.content.size)
          .insertContent(`\n\n--- Translated to ${this.getLanguageName(this.targetLanguage)} ---\n\n${translatedContent}`)
          .run();
      }

      this.translationStatus = {
        type: 'success',
        message: `Successfully translated to ${this.getLanguageName(this.targetLanguage)}`
      };

    } catch (error) {
      console.error('Translation error:', error);
      this.translationStatus = {
        type: 'error',
        message: 'Translation failed. Please try again.'
      };
    } finally {
      this.isTranslating = false;
      
      // Clear status after 5 seconds
      setTimeout(() => {
        this.translationStatus = null;
      }, 5000);
    }
  }

  private async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock translation - in a real implementation, this would call a translation API
    const mockTranslations: { [key: string]: string } = {
      'es': 'Este es un texto traducido al español. La traducción mantiene el significado original del documento.',
      'fr': 'Ceci est un texte traduit en français. La traduction conserve le sens original du document.',
      'de': 'Dies ist ein ins Deutsche übersetzter Text. Die Übersetzung behält die ursprüngliche Bedeutung des Dokuments bei.',
      'it': 'Questo è un testo tradotto in italiano. La traduzione mantiene il significato originale del documento.',
      'pt': 'Este é um texto traduzido para o português. A tradução mantém o significado original do documento.',
      'ru': 'Это текст, переведенный на русский язык. Перевод сохраняет первоначальный смысл документа.',
      'ja': 'これは日本語に翻訳されたテキストです。翻訳は文書の元の意味を保持しています。',
      'ko': '이것은 한국어로 번역된 텍스트입니다. 번역은 문서의 원래 의미를 유지합니다.',
      'zh': '这是翻译成中文的文本。翻译保持了文档的原始含义。',
      'ar': 'هذا نص مترجم إلى العربية. الترجمة تحافظ على المعنى الأصلي للوثيقة.'
    };

    // In a real implementation, you would call a translation API here
    // For now, we'll create a more realistic mock that processes the actual text
    return this.createMockTranslation(text, toLang, mockTranslations[toLang]);
  }

  private createMockTranslation(originalText: string, targetLang: string, sampleTranslation: string): string {
    // Split the original text into sentences
    const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) {
      return sampleTranslation || `[Translated to ${targetLang}] ${originalText}`;
    }

    // Create a mock translation by combining the sample with processed original text
    const translatedSentences = sentences.map((sentence, index) => {
      if (index === 0 && sampleTranslation) {
        return sampleTranslation.split('.')[0] || sentence.trim();
      }
      return `[${targetLang.toUpperCase()}] ${sentence.trim()}`;
    });

    return translatedSentences.join('. ') + '.';
  }

  private getDocumentContent(): string {
    if (!this.editor) return '';
    
    // Get the plain text content
    return this.editor.getText();
  }

  private replaceDocumentContent(newContent: string) {
    if (!this.editor) return;
    
    // Clear the document and insert new content
    this.editor.chain()
      .focus()
      .clearContent()
      .insertContent(newContent)
      .run();
  }

  private replaceTextPreservingFormat(translatedText: string) {
    if (!this.editor) return;

    try {
      // Get the current HTML content to preserve formatting
      const htmlContent = this.editor.getHTML();
      
      // Extract text content while preserving structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Replace text content while keeping HTML structure
      const textNodes = this.getTextNodes(tempDiv);
      const originalText = this.editor.getText();
      
      if (originalText.trim()) {
        // Simple approach: replace the entire content
        // In a production app, you'd want more sophisticated text replacement
        this.editor.chain()
          .focus()
          .selectAll()
          .insertContent(translatedText)
          .run();
      }
    } catch (error) {
      console.error('Error preserving format:', error);
      // Fallback to simple replacement
      this.replaceDocumentContent(translatedText);
    }
  }

  private getTextNodes(element: Element): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.trim()) {
        textNodes.push(node as Text);
      }
    }
    
    return textNodes;
  }

  getLanguageName(code: string): string {
    const lang = this.supportedLanguages.find(l => l.code === code);
    return lang ? lang.name : code;
  }

  // AI Writing Assistant functions
  async improveWriting() {
    await this.processWithAI('improve', 'Improving writing style and clarity...');
  }

  async fixGrammar() {
    await this.processWithAI('grammar', 'Fixing grammar and spelling...');
  }

  async summarizeContent() {
    await this.processWithAI('summarize', 'Creating summary...');
  }

  async changeTone() {
    const tone = prompt('What tone would you like? (formal, casual, professional, friendly)');
    if (tone) {
      await this.processWithAI('tone', `Changing tone to ${tone}...`, tone);
    }
  }

  async generateOutline() {
    await this.processWithAI('outline', 'Generating document outline...');
  }

  async addConclusion() {
    await this.processWithAI('conclusion', 'Adding conclusion...');
  }

  async expandContent() {
    await this.processWithAI('expand', 'Expanding content...');
  }

  private async processWithAI(action: string, statusMessage: string, parameter?: string) {
    if (!this.editor) return;

    this.isProcessingAI = true;
    this.translationStatus = {
      type: 'info',
      message: statusMessage
    };

    try {
      const content = this.editor.getText();
      const result = await this.mockAIProcess(action, content, parameter);
      
      // Insert the AI result
      this.editor.chain()
        .focus()
        .setTextSelection(this.editor.state.doc.content.size)
        .insertContent(`\n\n--- AI ${action.toUpperCase()} ---\n\n${result}`)
        .run();

      this.translationStatus = {
        type: 'success',
        message: `AI ${action} completed successfully`
      };

    } catch (error) {
      console.error('AI processing error:', error);
      this.translationStatus = {
        type: 'error',
        message: `AI ${action} failed. Please try again.`
      };
    } finally {
      this.isProcessingAI = false;
      
      setTimeout(() => {
        this.translationStatus = null;
      }, 5000);
    }
  }

  private async mockAIProcess(action: string, content: string, parameter?: string): Promise<string> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockResults: { [key: string]: string } = {
      'improve': 'Here is an improved version of your content with enhanced clarity, better word choice, and improved flow. The structure has been optimized for better readability.',
      'grammar': 'Grammar and spelling have been corrected. All sentences now follow proper grammatical rules and spelling conventions.',
      'summarize': 'Summary: This document discusses key concepts and provides important information. The main points include relevant details and actionable insights.',
      'tone': `The content has been rewritten in a ${parameter || 'professional'} tone, adjusting the language style and word choice accordingly.`,
      'outline': '1. Introduction\n2. Main Topic A\n   - Subtopic 1\n   - Subtopic 2\n3. Main Topic B\n   - Subtopic 1\n   - Subtopic 2\n4. Conclusion',
      'conclusion': 'In conclusion, this document has covered the essential points and provided valuable insights. The information presented offers a comprehensive understanding of the topic and serves as a foundation for further exploration.',
      'expand': 'This expanded version includes additional details, examples, and explanations to provide a more comprehensive understanding of the topic. Each point has been elaborated with supporting information and context.'
    };

    return mockResults[action] || `AI ${action} result for your content.`;
  }

  async askAI() {
    if (!this.aiQuestion.trim()) return;

    this.isProcessingAI = true;
    const question = this.aiQuestion;
    this.aiQuestion = '';

    try {
      // Simulate AI response delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock AI response
      this.aiResponse = `Based on your question "${question}", here's what I can help you with: This is a helpful AI response that addresses your specific question about the document. I can provide suggestions, explanations, and guidance to improve your writing.`;

    } catch (error) {
      console.error('AI question error:', error);
      this.aiResponse = 'Sorry, I encountered an error processing your question. Please try again.';
    } finally {
      this.isProcessingAI = false;
    }
  }
}