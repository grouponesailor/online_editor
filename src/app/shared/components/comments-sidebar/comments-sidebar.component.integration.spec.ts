import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { Editor } from '@tiptap/core';

import { CommentsSidebarComponent } from './comments-sidebar.component';
import { AiService } from '../../services/ai.service';

describe('CommentsSidebarComponent Integration Tests', () => {
  let component: CommentsSidebarComponent;
  let fixture: ComponentFixture<CommentsSidebarComponent>;
  let mockAiService: jasmine.SpyObj<AiService>;
  let mockEditor: jasmine.SpyObj<Editor>;

  beforeEach(async () => {
    mockAiService = jasmine.createSpyObj('AiService', ['summarizeText', 'checkServiceHealth']);
    mockEditor = jasmine.createSpyObj('Editor', ['getText', 'chain']);
    
    mockEditor.getText.and.returnValue('This is a comprehensive document about collaborative editing features and real-time synchronization capabilities.');
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

  describe('Full AI Workflow Integration', () => {
    it('should complete full summarization workflow', fakeAsync(() => {
      const mockSummary = 'This document discusses collaborative editing features with real-time synchronization and advanced user management capabilities.';
      mockAiService.summarizeText.and.returnValue(of(mockSummary));

      // Navigate to AI tab
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      // Find and click summarize button
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      expect(summarizeButton.nativeElement.textContent).toContain('Summarize Document');
      
      // Click the button
      summarizeButton.nativeElement.click();
      fixture.detectChanges();

      // Check loading state
      expect(component.isSummarizing).toBe(true);
      expect(summarizeButton.nativeElement.disabled).toBe(true);
      expect(summarizeButton.nativeElement.textContent).toContain('Summarizing...');

      tick(); // Wait for async operation
      fixture.detectChanges();

      // Check completion state
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe(mockSummary);
      
      // Check that summary is displayed
      const summaryElement = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(summaryElement).toBeTruthy();
      expect(summaryElement.nativeElement.textContent).toContain(mockSummary);

      // Check action buttons are present
      const actionButtons = fixture.debugElement.queryAll(By.css('.bg-purple-100, .bg-blue-100, .bg-gray-100'));
      expect(actionButtons.length).toBe(3); // Copy, Insert, Close buttons
    }));

    it('should handle error state in UI', fakeAsync(() => {
      mockAiService.summarizeText.and.returnValue(throwError('Network error'));

      // Navigate to AI tab and click summarize
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.query(By.css('button'));
      summarizeButton.nativeElement.click();
      fixture.detectChanges();

      tick(); // Wait for async operation
      fixture.detectChanges();

      // Check error state
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe('Sorry, there was an error generating the summary. Please try again later.');
      
      // Check that error message is displayed
      const summaryElement = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(summaryElement.nativeElement.textContent).toContain('Sorry, there was an error');
    }));

    it('should copy summary to clipboard', fakeAsync(() => {
      const mockSummary = 'Test summary for clipboard';
      component.aiSummary = mockSummary;
      
      // Mock clipboard API
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });

      component.setActiveTab('collaborators');
      fixture.detectChanges();

      // Find and click copy button
      const copyButton = fixture.debugElement.query(By.css('.bg-purple-100'));
      copyButton.nativeElement.click();

      tick(); // Wait for async operation

      expect(mockClipboard.writeText).toHaveBeenCalledWith(mockSummary);
    }));

    it('should insert summary into document', () => {
      const mockSummary = 'Test summary for insertion';
      component.aiSummary = mockSummary;
      
      const mockChain = {
        focus: jasmine.createSpy('focus').and.returnValue({
          insertContent: jasmine.createSpy('insertContent').and.returnValue({
            run: jasmine.createSpy('run')
          })
        })
      };
      mockEditor.chain.and.returnValue(mockChain);

      component.setActiveTab('collaborators');
      fixture.detectChanges();

      // Find and click insert button
      const insertButton = fixture.debugElement.query(By.css('.bg-blue-100'));
      insertButton.nativeElement.click();

      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus().insertContent).toHaveBeenCalledWith('\n\n**AI Summary:**\nTest summary for insertion\n\n');
      expect(component.aiSummary).toBe(null);
    });

    it('should close summary', () => {
      component.aiSummary = 'Test summary to close';
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      // Find and click close button
      const closeButton = fixture.debugElement.query(By.css('.bg-gray-100'));
      closeButton.nativeElement.click();

      expect(component.aiSummary).toBe(null);
    });
  });

  describe('Tab Navigation Integration', () => {
    it('should switch between tabs correctly', () => {
      // Start with comments tab
      expect(component.activeTab).toBe('comments');
      
      // Switch to AI tab
      const aiTabButton = fixture.debugElement.queryAll(By.css('button'))[2]; // Third tab
      aiTabButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.activeTab).toBe('collaborators');
      
      // Check that AI content is visible
      const aiContent = fixture.debugElement.query(By.css('[data-tab-content="collaborators"]'));
      expect(aiContent).toBeTruthy();
    });

    it('should maintain AI state when switching tabs', fakeAsync(() => {
      const mockSummary = 'Persistent summary';
      mockAiService.summarizeText.and.returnValue(of(mockSummary));

      // Generate summary in AI tab
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.query(By.css('button'));
      summarizeButton.nativeElement.click();
      tick();
      fixture.detectChanges();

      expect(component.aiSummary).toBe(mockSummary);

      // Switch to comments tab
      component.setActiveTab('comments');
      fixture.detectChanges();

      // Switch back to AI tab
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      // Summary should still be there
      expect(component.aiSummary).toBe(mockSummary);
      const summaryElement = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(summaryElement.nativeElement.textContent).toContain(mockSummary);
    }));
  });

  describe('Comments Integration', () => {
    it('should add comment through UI', () => {
      component.setActiveTab('comments');
      fixture.detectChanges();

      // Find comment textarea and add button
      const textarea = fixture.debugElement.query(By.css('textarea'));
      const addButton = fixture.debugElement.query(By.css('.bg-\\[\\#6200EE\\]'));

      // Initially button should be disabled
      expect(addButton.nativeElement.disabled).toBe(true);

      // Type in textarea
      textarea.nativeElement.value = 'New test comment';
      textarea.nativeElement.dispatchEvent(new Event('input'));
      component.newCommentText = 'New test comment';
      fixture.detectChanges();

      // Button should now be enabled
      expect(addButton.nativeElement.disabled).toBe(false);

      // Click add button
      const initialCount = component.comments.length;
      addButton.nativeElement.click();
      fixture.detectChanges();

      // Check comment was added
      expect(component.comments.length).toBe(initialCount + 1);
      expect(component.comments[0].text).toBe('New test comment');
      expect(component.newCommentText).toBe('');
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper ARIA labels for AI functionality', () => {
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.query(By.css('button'));
      expect(summarizeButton.nativeElement.getAttribute('title')).toBeTruthy();
    });

    it('should handle keyboard navigation', () => {
      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.query(By.css('button'));
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      summarizeButton.nativeElement.dispatchEvent(enterEvent);
      
      // Should trigger summarization
      expect(mockAiService.summarizeText).toHaveBeenCalled();
    });
  });

  describe('Performance Integration', () => {
    it('should not make duplicate API calls', fakeAsync(() => {
      mockAiService.summarizeText.and.returnValue(of('Test summary'));

      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.query(By.css('button'));
      
      // Click multiple times rapidly
      summarizeButton.nativeElement.click();
      summarizeButton.nativeElement.click();
      summarizeButton.nativeElement.click();

      tick();

      // Should only make one API call
      expect(mockAiService.summarizeText).toHaveBeenCalledTimes(1);
    }));

    it('should handle large document text efficiently', fakeAsync(() => {
      const largeText = 'Large document content. '.repeat(10000);
      mockEditor.getText.and.returnValue(largeText);
      mockAiService.summarizeText.and.returnValue(of('Summary of large document'));

      component.setActiveTab('collaborators');
      fixture.detectChanges();

      const summarizeButton = fixture.debugElement.query(By.css('button'));
      summarizeButton.nativeElement.click();

      tick();

      expect(mockAiService.summarizeText).toHaveBeenCalledWith(largeText);
      expect(component.aiSummary).toBe('Summary of large document');
    }));
  });
});