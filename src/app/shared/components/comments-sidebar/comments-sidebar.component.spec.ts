import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Editor } from '@tiptap/core';

import { CommentsSidebarComponent } from './comments-sidebar.component';
import { AiService } from '../../services/ai.service';

describe('CommentsSidebarComponent', () => {
  let component: CommentsSidebarComponent;
  let fixture: ComponentFixture<CommentsSidebarComponent>;
  let mockAiService: jasmine.SpyObj<AiService>;
  let mockEditor: jasmine.SpyObj<Editor>;

  beforeEach(async () => {
    // Create spy objects
    mockAiService = jasmine.createSpyObj('AiService', ['summarizeText', 'checkServiceHealth']);
    mockEditor = jasmine.createSpyObj('Editor', ['getText', 'chain']);
    
    // Setup default return values
    mockEditor.getText.and.returnValue('Sample document text for testing purposes.');
    mockEditor.chain.and.returnValue({
      focus: () => ({
        insertContent: jasmine.createSpy('insertContent').and.returnValue({
          run: jasmine.createSpy('run')
        })
      })
    });

    await TestBed.configureTestingModule({
      declarations: [CommentsSidebarComponent],
      imports: [FormsModule],
      providers: [
        { provide: AiService, useValue: mockAiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsSidebarComponent);
    component = fixture.componentInstance;
    component.editor = mockEditor;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.activeTab).toBe('comments');
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe(null);
      expect(component.newCommentText).toBe('');
    });

    it('should have correct tabs configuration', () => {
      expect(component.tabs).toEqual([
        { id: 'comments', label: 'Comments', icon: 'fas fa-comments' },
        { id: 'history', label: 'History', icon: 'fas fa-history' },
        { id: 'collaborators', label: 'AI', icon: 'fas fa-robot' }
      ]);
    });
  });

  describe('Tab Navigation', () => {
    it('should set active tab correctly', () => {
      component.setActiveTab('history');
      expect(component.activeTab).toBe('history');
    });

    it('should close collaborator menu when switching tabs', () => {
      component.showCollaboratorMenu = 'user1';
      component.setActiveTab('comments');
      expect(component.showCollaboratorMenu).toBe(null);
    });
  });

  describe('Comments Functionality', () => {
    it('should add new comment', () => {
      const initialCommentsCount = component.comments.length;
      component.newCommentText = 'This is a test comment';
      
      component.addComment();
      
      expect(component.comments.length).toBe(initialCommentsCount + 1);
      expect(component.comments[0].text).toBe('This is a test comment');
      expect(component.comments[0].author.name).toBe('Current User');
      expect(component.newCommentText).toBe('');
    });

    it('should not add empty comment', () => {
      const initialCommentsCount = component.comments.length;
      component.newCommentText = '   ';
      
      component.addComment();
      
      expect(component.comments.length).toBe(initialCommentsCount);
    });

    it('should resolve comment', () => {
      const commentToResolve = component.comments[0];
      const initialCommentsCount = component.comments.length;
      
      component.resolveComment(commentToResolve);
      
      expect(component.comments.length).toBe(initialCommentsCount - 1);
      expect(component.comments.find(c => c.id === commentToResolve.id)).toBeUndefined();
    });
  });

  describe('AI Summarization', () => {
    it('should handle successful summarization', fakeAsync(() => {
      const mockSummary = 'This is an AI-generated summary of the document.';
      mockAiService.summarizeText.and.returnValue(of(mockSummary));

      component.summarizeDocument();
      
      expect(component.isSummarizing).toBe(true);
      expect(mockEditor.getText).toHaveBeenCalled();
      
      tick(); // Wait for async operation
      
      expect(component.aiSummary).toBe(mockSummary);
      expect(component.isSummarizing).toBe(false);
      expect(mockAiService.summarizeText).toHaveBeenCalledWith('Sample document text for testing purposes.');
    }));

    it('should handle summarization error', fakeAsync(() => {
      mockAiService.summarizeText.and.returnValue(throwError('API Error'));

      component.summarizeDocument();
      
      expect(component.isSummarizing).toBe(true);
      
      tick(); // Wait for async operation
      
      expect(component.aiSummary).toBe('Sorry, there was an error generating the summary. Please try again later.');
      expect(component.isSummarizing).toBe(false);
    }));

    it('should handle empty document', fakeAsync(() => {
      mockEditor.getText.and.returnValue('');

      component.summarizeDocument();
      
      tick(); // Wait for async operation
      
      expect(component.aiSummary).toBe('The document appears to be empty. Please add some content to generate a summary.');
      expect(component.isSummarizing).toBe(false);
      expect(mockAiService.summarizeText).not.toHaveBeenCalled();
    }));

    it('should handle whitespace-only document', fakeAsync(() => {
      mockEditor.getText.and.returnValue('   \n\t   ');

      component.summarizeDocument();
      
      tick(); // Wait for async operation
      
      expect(component.aiSummary).toBe('The document appears to be empty. Please add some content to generate a summary.');
      expect(component.isSummarizing).toBe(false);
      expect(mockAiService.summarizeText).not.toHaveBeenCalled();
    }));

    it('should handle missing editor', fakeAsync(() => {
      component.editor = null;
      spyOn(console, 'warn');

      component.summarizeDocument();
      
      tick(); // Wait for async operation
      
      expect(console.warn).toHaveBeenCalledWith('No editor available for summarization');
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe(null);
    }));
  });

  describe('Copy to Clipboard', () => {
    it('should copy text to clipboard using modern API', async () => {
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      const testText = 'Text to copy';
      await component.copyToClipboard(testText);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(testText);
    });

    it('should fallback to execCommand when clipboard API fails', async () => {
      // Mock clipboard API to throw error
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.reject('Not supported'))
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      // Mock document methods
      const mockTextArea = {
        value: '',
        select: jasmine.createSpy('select')
      };
      spyOn(document, 'createElement').and.returnValue(mockTextArea as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(document, 'execCommand');

      const testText = 'Text to copy with fallback';
      await component.copyToClipboard(testText);

      expect(mockTextArea.value).toBe(testText);
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('Insert Summary into Document', () => {
    it('should insert summary into document', () => {
      component.aiSummary = 'Test summary to insert';
      const mockChain = {
        focus: jasmine.createSpy('focus').and.returnValue({
          insertContent: jasmine.createSpy('insertContent').and.returnValue({
            run: jasmine.createSpy('run')
          })
        })
      };
      mockEditor.chain.and.returnValue(mockChain);

      component.insertSummaryIntoDocument();

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus).toHaveBeenCalled();
      expect(mockChain.focus().insertContent).toHaveBeenCalledWith('\n\n**AI Summary:**\nTest summary to insert\n\n');
      expect(component.aiSummary).toBe(null);
    });

    it('should not insert when no summary available', () => {
      component.aiSummary = null;

      component.insertSummaryIntoDocument();

      expect(mockEditor.chain).not.toHaveBeenCalled();
    });

    it('should not insert when no editor available', () => {
      component.editor = null;
      component.aiSummary = 'Test summary';

      component.insertSummaryIntoDocument();

      expect(mockEditor.chain).not.toHaveBeenCalled();
    });
  });

  describe('Collaborator Management', () => {
    it('should validate email correctly', () => {
      expect(component.isValidEmail('test@example.com')).toBe(true);
      expect(component.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(component.isValidEmail('invalid-email')).toBe(false);
      expect(component.isValidEmail('test@')).toBe(false);
      expect(component.isValidEmail('@example.com')).toBe(false);
      expect(component.isValidEmail('')).toBe(false);
    });

    it('should add new collaborator', () => {
      const initialCount = component.allCollaborators.length;
      component.newCollaboratorEmail = 'newuser@example.com';

      component.addCollaborator();

      expect(component.allCollaborators.length).toBe(initialCount + 1);
      expect(component.allCollaborators[component.allCollaborators.length - 1].email).toBe('newuser@example.com');
      expect(component.newCollaboratorEmail).toBe('');
    });

    it('should not add collaborator with invalid email', () => {
      const initialCount = component.allCollaborators.length;
      component.newCollaboratorEmail = 'invalid-email';

      component.addCollaborator();

      expect(component.allCollaborators.length).toBe(initialCount);
    });

    it('should not add existing collaborator', () => {
      spyOn(window, 'alert');
      const existingEmail = component.allCollaborators[0].email;
      const initialCount = component.allCollaborators.length;
      component.newCollaboratorEmail = existingEmail;

      component.addCollaborator();

      expect(component.allCollaborators.length).toBe(initialCount);
      expect(window.alert).toHaveBeenCalledWith('This person is already a collaborator');
    });

    it('should remove collaborator', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const collaboratorToRemove = component.allCollaborators[0];
      const initialCount = component.allCollaborators.length;

      component.removeCollaborator(collaboratorToRemove);

      expect(component.allCollaborators.length).toBe(initialCount - 1);
      expect(component.allCollaborators.find(c => c.id === collaboratorToRemove.id)).toBeUndefined();
    });

    it('should not remove collaborator when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const collaboratorToRemove = component.allCollaborators[0];
      const initialCount = component.allCollaborators.length;

      component.removeCollaborator(collaboratorToRemove);

      expect(component.allCollaborators.length).toBe(initialCount);
    });

    it('should toggle collaborator menu', () => {
      const collaboratorId = 'user1';
      
      component.toggleCollaboratorMenu(collaboratorId);
      expect(component.showCollaboratorMenu).toBe(collaboratorId);
      
      component.toggleCollaboratorMenu(collaboratorId);
      expect(component.showCollaboratorMenu).toBe(null);
    });

    it('should change collaborator role', () => {
      spyOn(window, 'prompt').and.returnValue('editor');
      const collaborator = component.allCollaborators[0];
      const originalRole = collaborator.role;

      component.changeRole(collaborator);

      expect(collaborator.role).toBe('editor');
      expect(component.showCollaboratorMenu).toBe(null);
    });

    it('should not change role with invalid input', () => {
      spyOn(window, 'prompt').and.returnValue('invalid-role');
      const collaborator = component.allCollaborators[0];
      const originalRole = collaborator.role;

      component.changeRole(collaborator);

      expect(collaborator.role).toBe(originalRole);
    });
  });

  describe('Version History', () => {
    it('should view version', () => {
      spyOn(console, 'log');
      const version = component.versionHistory[0];

      component.viewVersion(version);

      expect(console.log).toHaveBeenCalledWith('View version:', version);
    });

    it('should restore version when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'log');
      const version = component.versionHistory[0];

      component.restoreVersion(version);

      expect(window.confirm).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Restore version:', version);
    });

    it('should not restore version when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(console, 'log');
      const version = component.versionHistory[0];

      component.restoreVersion(version);

      expect(window.confirm).toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('UI Integration Tests', () => {
    it('should display AI tab correctly', () => {
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const aiTab = fixture.debugElement.nativeElement.querySelector('[data-tab="collaborators"]');
      expect(aiTab).toBeTruthy();
    });

    it('should show summarize button', () => {
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.nativeElement.querySelector('button');
      expect(summarizeButton).toBeTruthy();
      expect(summarizeButton.textContent).toContain('Summarize Document');
    });

    it('should disable summarize button when summarizing', () => {
      component.setActiveTab('collaborators');
      component.isSummarizing = true;
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.nativeElement.querySelector('button');
      expect(summarizeButton.disabled).toBe(true);
      expect(summarizeButton.textContent).toContain('Summarizing...');
    });

    it('should display AI summary when available', () => {
      component.setActiveTab('collaborators');
      component.aiSummary = 'Test AI summary content';
      fixture.detectChanges();

      const summaryElement = fixture.debugElement.nativeElement.querySelector('.bg-white.rounded-lg p');
      expect(summaryElement).toBeTruthy();
      expect(summaryElement.textContent).toContain('Test AI summary content');
    });
  });
});