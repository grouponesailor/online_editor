import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AiService, SummarizationResponse } from './ai.service';

describe('AiService', () => {
  let service: AiService;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiService);
    
    // Mock fetch globally
    fetchSpy = spyOn(window, 'fetch');
  });

  afterEach(() => {
    fetchSpy.calls.reset();
  });

  describe('summarizeText', () => {
    it('should return error for empty text', (done) => {
      service.summarizeText('').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBe('No text provided for summarization');
          done();
        }
      });
    });

    it('should return error for whitespace-only text', (done) => {
      service.summarizeText('   \n\t   ').subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBe('No text provided for summarization');
          done();
        }
      });
    });

    it('should successfully summarize text with primary model', (done) => {
      const mockResponse: SummarizationResponse[] = [{
        summary_text: 'This is a test summary of the document content.'
      }];

      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response));

      const testText = 'This is a long document that needs to be summarized for testing purposes.';

      service.summarizeText(testText).subscribe({
        next: (summary) => {
          expect(summary).toBe('This is a test summary of the document content.');
          expect(fetchSpy).toHaveBeenCalledTimes(1);
          expect(fetchSpy).toHaveBeenCalledWith(
            'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
            jasmine.objectContaining({
              method: 'POST',
              headers: jasmine.objectContaining({
                'Authorization': jasmine.stringMatching(/^Bearer /),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }),
              body: jasmine.stringContaining(testText)
            })
          );
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should fallback to next model when primary fails', (done) => {
      // First call fails
      fetchSpy.and.returnValues(
        Promise.resolve({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable'
        } as Response),
        // Second call succeeds
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ summary_text: 'Fallback summary' }])
        } as Response)
      );

      const testText = 'Test document for fallback testing.';

      service.summarizeText(testText).subscribe({
        next: (summary) => {
          expect(summary).toBe('Fallback summary');
          expect(fetchSpy).toHaveBeenCalledTimes(2);
          // Check that different models were called
          expect(fetchSpy.calls.argsFor(0)[0]).toContain('facebook/bart-large-cnn');
          expect(fetchSpy.calls.argsFor(1)[0]).toContain('sshleifer/distilbart-cnn-12-6');
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should return fallback summary when all models fail', (done) => {
      // All API calls fail
      fetchSpy.and.returnValue(Promise.resolve({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      } as Response));

      const testText = 'This is a test document with multiple sentences. It contains various information about testing. The document should generate a fallback summary when AI models fail.';

      service.summarizeText(testText).subscribe({
        next: (summary) => {
          expect(summary).toContain('This document contains');
          expect(summary).toContain('words across');
          expect(summary).toContain('paragraphs');
          expect(fetchSpy).toHaveBeenCalledTimes(4); // All 4 models tried
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should truncate long text before sending to API', (done) => {
      const mockResponse: SummarizationResponse[] = [{
        summary_text: 'Summary of truncated text'
      }];

      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response));

      // Create text with more than 1000 words
      const longText = 'word '.repeat(1500);

      service.summarizeText(longText).subscribe({
        next: (summary) => {
          expect(summary).toBe('Summary of truncated text');
          
          // Check that the request body contains truncated text
          const requestBody = JSON.parse(fetchSpy.calls.argsFor(0)[1].body);
          const sentWords = requestBody.inputs.split(/\s+/);
          expect(sentWords.length).toBeLessThanOrEqual(1001); // 1000 words + "..."
          expect(requestBody.inputs).toContain('...');
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should handle invalid API response format', (done) => {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      } as Response));

      const testText = 'Test document for invalid response handling.';

      service.summarizeText(testText).subscribe({
        next: (summary) => {
          // Should fallback to generated summary
          expect(summary).toContain('This document contains');
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should handle network errors gracefully', (done) => {
      fetchSpy.and.returnValue(Promise.reject(new Error('Network error')));

      const testText = 'Test document for network error handling.';

      service.summarizeText(testText).subscribe({
        next: (summary) => {
          // Should fallback to generated summary
          expect(summary).toContain('This document contains');
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });
  });

  describe('checkServiceHealth', () => {
    it('should return true when service is healthy', (done) => {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ summary_text: 'Health check passed' }])
      } as Response));

      service.checkServiceHealth().subscribe({
        next: (isHealthy) => {
          expect(isHealthy).toBe(true);
          expect(fetchSpy).toHaveBeenCalledTimes(1);
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should return false when service is unhealthy', (done) => {
      fetchSpy.and.returnValue(Promise.resolve({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      } as Response));

      service.checkServiceHealth().subscribe({
        next: (isHealthy) => {
          expect(isHealthy).toBe(false);
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });

    it('should return false on network error', (done) => {
      fetchSpy.and.returnValue(Promise.reject(new Error('Network error')));

      service.checkServiceHealth().subscribe({
        next: (isHealthy) => {
          expect(isHealthy).toBe(false);
          done();
        },
        error: (error) => fail(`Should not have failed: ${error}`)
      });
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', () => {
      const models = service.getAvailableModels();
      expect(models).toEqual([
        'facebook/bart-large-cnn',
        'sshleifer/distilbart-cnn-12-6',
        'google/pegasus-xsum',
        't5-small'
      ]);
    });

    it('should return a copy of the models array', () => {
      const models1 = service.getAvailableModels();
      const models2 = service.getAvailableModels();
      expect(models1).not.toBe(models2); // Different array instances
      expect(models1).toEqual(models2); // Same content
    });
  });

  describe('private methods', () => {
    it('should generate appropriate fallback summary', () => {
      const testText = 'This is the first sentence. This is the second sentence. This is the third sentence. This is the fourth sentence.';
      
      // Access private method through any cast for testing
      const fallbackSummary = (service as any).generateFallbackSummary(testText);
      
      expect(fallbackSummary).toContain('This document contains');
      expect(fallbackSummary).toContain('words across');
      expect(fallbackSummary).toContain('This is the first sentence');
    });

    it('should truncate fallback summary if too long', () => {
      const longText = 'Very long sentence that repeats itself. '.repeat(50);
      
      const fallbackSummary = (service as any).generateFallbackSummary(longText);
      
      expect(fallbackSummary.length).toBeLessThanOrEqual(200);
      if (fallbackSummary.length === 200) {
        expect(fallbackSummary).toEndWith('...');
      }
    });

    it('should truncate text correctly', () => {
      const longText = 'word '.repeat(1500);
      
      const truncated = (service as any).truncateText(longText, 1000);
      const words = truncated.split(/\s+/);
      
      expect(words.length).toBeLessThanOrEqual(1001); // 1000 + "..."
      expect(truncated).toEndWith('...');
    });

    it('should not truncate short text', () => {
      const shortText = 'This is a short text.';
      
      const result = (service as any).truncateText(shortText, 1000);
      
      expect(result).toBe(shortText);
    });
  });
});