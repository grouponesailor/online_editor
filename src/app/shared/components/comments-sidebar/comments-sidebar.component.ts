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

  private getLanguageName(code: string): string {
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