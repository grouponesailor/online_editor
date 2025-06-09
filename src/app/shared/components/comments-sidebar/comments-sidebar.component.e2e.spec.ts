import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of, delay } from 'rxjs';
import { Editor } from '@tiptap/core';

import { CommentsSidebarComponent } from './comments-sidebar.component';
import { AiService } from '../../services/ai.service';

describe('CommentsSidebarComponent E2E Tests', () => {
  let component: CommentsSidebarComponent;
  let fixture: ComponentFixture<CommentsSidebarComponent>;
  let mockAiService: jasmine.SpyObj<AiService>;
  let mockEditor: jasmine.SpyObj<Editor>;

  beforeEach(async () => {
    mockAiService = jasmine.createSpyObj('AiService', ['summarizeText', 'checkServiceHealth']);
    mockEditor = jasmine.createSpyObj('Editor', ['getText', 'chain']);
    
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

  describe('Complete User Journey - AI Summarization', () => {
    it('should complete full user journey from document creation to AI summary', async () => {
      // Step 1: User has a document with content
      const documentContent = `
        # Collaborative Document Editor

        This is a comprehensive document about building a collaborative document editor.
        It includes features like real-time editing, user management, and AI-powered summarization.

        ## Key Features
        - Real-time collaboration
        - Rich text editing
        - AI summarization
        - Comment system
        - Version history

        ## Technical Implementation
        The system uses Angular for the frontend, TipTap for rich text editing,
        and Hugging Face API for AI summarization capabilities.
      `;
      
      mockEditor.getText.and.returnValue(documentContent);
      
      // Step 2: User navigates to AI tab
      const aiTab = fixture.debugElement.queryAll(By.css('button'))[2];
      aiTab.nativeElement.click();
      fixture.detectChanges();
      
      expect(component.activeTab).toBe('collaborators');
      
      // Step 3: User sees the AI summarization interface
      const aiInterface = fixture.debugElement.query(By.css('[data-tab-content="collaborators"]'));
      expect(aiInterface).toBeTruthy();
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      expect(summarizeButton.nativeElement.textContent).toContain('Summarize Document');
      expect(summarizeButton.nativeElement.disabled).toBe(false);
      
      // Step 4: User clicks summarize button
      const expectedSummary = 'This document outlines a collaborative document editor with real-time editing, AI summarization, and comprehensive user management features.';
      mockAiService.summarizeText.and.returnValue(of(expectedSummary).pipe(delay(1000)));
      
      summarizeButton.nativeElement.click();
      fixture.detectChanges();
      
      // Step 5: User sees loading state
      expect(component.isSummarizing).toBe(true);
      expect(summarizeButton.nativeElement.disabled).toBe(true);
      expect(summarizeButton.nativeElement.textContent).toContain('Summarizing...');
      
      // Step 6: Wait for AI response
      await new Promise(resolve => setTimeout(resolve, 1100));
      fixture.detectChanges();
      
      // Step 7: User sees the generated summary
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe(expectedSummary);
      
      const summaryDisplay = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(summaryDisplay).toBeTruthy();
      expect(summaryDisplay.nativeElement.textContent).toContain(expectedSummary);
      
      // Step 8: User sees action buttons
      const actionButtons = fixture.debugElement.queryAll(By.css('.bg-purple-100, .bg-blue-100, .bg-gray-100'));
      expect(actionButtons.length).toBe(3);
      
      const copyButton = actionButtons[0];
      const insertButton = actionButtons[1];
      const closeButton = actionButtons[2];
      
      expect(copyButton.nativeElement.textContent).toContain('Copy');
      expect(insertButton.nativeElement.textContent).toContain('Insert');
      expect(closeButton.nativeElement.textContent).toContain('Close');
      
      // Step 9: User copies summary to clipboard
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true
      });
      
      copyButton.nativeElement.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith(expectedSummary);
      
      // Step 10: User inserts summary into document
      const mockChain = {
        focus: jasmine.createSpy('focus').and.returnValue({
          insertContent: jasmine.createSpy('insertContent').and.returnValue({
            run: jasmine.createSpy('run')
          })
        })
      };
      mockEditor.chain.and.returnValue(mockChain);
      
      insertButton.nativeElement.click();
      fixture.detectChanges();
      
      expect(mockEditor.chain).toHaveBeenCalled();
      expect(mockChain.focus().insertContent).toHaveBeenCalledWith(`\n\n**AI Summary:**\n${expectedSummary}\n\n`);
      expect(component.aiSummary).toBe(null);
      
      // Step 11: Summary interface is cleared
      const summaryDisplayAfterInsert = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(summaryDisplayAfterInsert).toBeFalsy();
    });
  });

  describe('Error Handling User Journey', () => {
    it('should handle API failure gracefully', async () => {
      const documentContent = 'Test document for error handling';
      mockEditor.getText.and.returnValue(documentContent);
      
      // Navigate to AI tab
      component.setActiveTab('collaborators');
      fixture.detectChanges();
      
      // Mock API failure
      mockAiService.summarizeText.and.returnValue(of('').pipe(
        delay(500),
        // Simulate error after delay
        () => { throw new Error('API Error'); }
      ));
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      summarizeButton.nativeElement.click();
      fixture.detectChanges();
      
      // User sees loading state
      expect(component.isSummarizing).toBe(true);
      
      // Wait for error
      await new Promise(resolve => setTimeout(resolve, 600));
      fixture.detectChanges();
      
      // User sees error message
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe('Sorry, there was an error generating the summary. Please try again later.');
      
      const errorDisplay = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(errorDisplay.nativeElement.textContent).toContain('Sorry, there was an error');
      
      // User can try again
      expect(summarizeButton.nativeElement.disabled).toBe(false);
      expect(summarizeButton.nativeElement.textContent).toContain('Summarize Document');
    });
  });

  describe('Empty Document User Journey', () => {
    it('should handle empty document appropriately', () => {
      mockEditor.getText.and.returnValue('');
      
      // Navigate to AI tab
      component.setActiveTab('collaborators');
      fixture.detectChanges();
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      summarizeButton.nativeElement.click();
      fixture.detectChanges();
      
      // User immediately sees empty document message
      expect(component.isSummarizing).toBe(false);
      expect(component.aiSummary).toBe('The document appears to be empty. Please add some content to generate a summary.');
      expect(mockAiService.summarizeText).not.toHaveBeenCalled();
      
      const messageDisplay = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(messageDisplay.nativeElement.textContent).toContain('document appears to be empty');
    });
  });

  describe('Multi-Tab User Journey', () => {
    it('should maintain state across tab switches', async () => {
      const documentContent = 'Test document for tab switching';
      const expectedSummary = 'Test summary that persists across tabs';
      
      mockEditor.getText.and.returnValue(documentContent);
      mockAiService.summarizeText.and.returnValue(of(expectedSummary));
      
      // Start in comments tab
      expect(component.activeTab).toBe('comments');
      
      // Switch to AI tab and generate summary
      component.setActiveTab('collaborators');
      fixture.detectChanges();
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      summarizeButton.nativeElement.click();
      fixture.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      fixture.detectChanges();
      
      expect(component.aiSummary).toBe(expectedSummary);
      
      // Switch to history tab
      component.setActiveTab('history');
      fixture.detectChanges();
      
      // Switch back to AI tab
      component.setActiveTab('collaborators');
      fixture.detectChanges();
      
      // Summary should still be there
      expect(component.aiSummary).toBe(expectedSummary);
      const summaryDisplay = fixture.debugElement.query(By.css('.bg-white.rounded-lg'));
      expect(summaryDisplay.nativeElement.textContent).toContain(expectedSummary);
    });
  });

  describe('Accessibility User Journey', () => {
    it('should support keyboard navigation', () => {
      component.setActiveTab('collaborators');
      fixture.detectChanges();
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      
      // Focus the button
      summarizeButton.nativeElement.focus();
      expect(document.activeElement).toBe(summarizeButton.nativeElement);
      
      // Press Enter
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      summarizeButton.nativeElement.dispatchEvent(enterEvent);
      
      expect(mockAiService.summarizeText).toHaveBeenCalled();
    });

    it('should support screen reader announcements', () => {
      component.setActiveTab('collaborators');
      component.isSummarizing = true;
      fixture.detectChanges();
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      
      // Check ARIA attributes for screen readers
      expect(summarizeButton.nativeElement.getAttribute('aria-busy')).toBe('true');
      expect(summarizeButton.nativeElement.textContent).toContain('Summarizing...');
    });
  });

  describe('Performance User Journey', () => {
    it('should handle rapid clicking gracefully', async () => {
      const documentContent = 'Test document for rapid clicking';
      mockEditor.getText.and.returnValue(documentContent);
      mockAiService.summarizeText.and.returnValue(of('Test summary').pipe(delay(1000)));
      
      component.setActiveTab('collaborators');
      fixture.detectChanges();
      
      const summarizeButton = fixture.debugElement.query(By.css('button'));
      
      // Rapid clicks
      summarizeButton.nativeElement.click();
      summarizeButton.nativeElement.click();
      summarizeButton.nativeElement.click();
      
      // Should only trigger one API call
      expect(mockAiService.summarizeText).toHaveBeenCalledTimes(1);
      
      // Button should be disabled during processing
      expect(summarizeButton.nativeElement.disabled).toBe(true);
    });
  });
});