import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-file-toolbar',
  templateUrl: './file-toolbar.component.html',
  styleUrls: ['./file-toolbar.component.css']
})
export class FileToolbarComponent {
  @Input() documentId: string = '';
  @Input() documentName: string = 'Untitled Document';
  @Output() newDocument = new EventEmitter<void>();
  @Output() openDocument = new EventEmitter<void>();
  @Output() saveDocument = new EventEmitter<void>();
  @Output() exportDocument = new EventEmitter<string>();
  @Output() share = new EventEmitter<void>();

  constructor(private fileService: FileService) {}

  // Listen for Ctrl+S keyboard shortcut
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault(); // Prevent browser's default save dialog
      this.saveDocumentLocally();
    }
  }

  onNewDocument() {
    // First save the current document
    this.saveCurrentDocument();
    
    // Then create a new document
    this.fileService.createNewDocument().subscribe(
      (newDocument: any) => {
        this.showSaveNotification('Current document saved. Creating new document...');
        
        // Navigate to the new document after a short delay
        setTimeout(() => {
          window.location.href = `/editor/${newDocument.id}`;
        }, 1000);
      },
      (error: any) => {
        console.error('Failed to create new document:', error);
        this.showSaveNotification('Failed to create new document', 'error');
      }
    );
  }

  private saveCurrentDocument() {
    if (this.documentId) {
      // Save the current document before creating a new one
      this.saveDocumentLocally();
    }
  }

  onOpenDocument() {
    this.openDocument.emit();
  }

  onSaveDocument() {
    this.saveDocument.emit();
  }

  saveDocumentLocally() {
    // Save document to local storage and add to File Manager
    this.fileService.saveDocumentLocally(this.documentId, this.documentName).subscribe(
      (success: boolean) => {
        if (success) {
          this.showSaveNotification('Document saved locally and added to File Manager');
          
          // Trigger version save in comments sidebar if available
          this.triggerVersionSave();
        } else {
          this.showSaveNotification('Failed to save document', 'error');
        }
      }
    );
    
    // Also emit the save event for parent components
    this.saveDocument.emit();
  }

  private triggerVersionSave() {
    // Emit a custom event that the editor component can listen to
    if (this.documentId) {
      const event = new CustomEvent('documentSaved', {
        detail: { documentId: this.documentId, timestamp: new Date() }
      });
      window.dispatchEvent(event);
    }
  }

  private showSaveNotification(message: string, type: 'success' | 'error' = 'success') {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Export functions with file system save dialog
  onExportPDF() {
    this.exportToFileSystem('pdf', 'application/pdf');
  }

  onExportWord() {
    this.exportToFileSystem('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  onExportExcel() {
    this.exportToFileSystem('xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  onExportPowerPoint() {
    this.exportToFileSystem('pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  }

  private async exportToFileSystem(format: string, mimeType: string) {
    try {
      // Get the document content for export
      const documentContent = await this.getDocumentContentForExport();
      
      // Create the file content based on format
      const fileContent = this.generateFileContent(documentContent, format);
      
      // Create blob with appropriate MIME type
      const blob = new Blob([fileContent], { type: mimeType });
      
      // Check if the File System Access API is supported
      if ('showSaveFilePicker' in window) {
        await this.saveWithFileSystemAPI(blob, format);
      } else {
        // Fallback to traditional download method
        this.saveWithDownloadFallback(blob, format);
      }
      
      this.showSaveNotification(`Document exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error(`Export to ${format} failed:`, error);
      this.showSaveNotification(`Failed to export as ${format.toUpperCase()}`, 'error');
    }
  }

  private async saveWithFileSystemAPI(blob: Blob, format: string) {
    try {
      // Define file type options
      const fileTypeMap: { [key: string]: any } = {
        'pdf': {
          description: 'PDF files',
          accept: { 'application/pdf': ['.pdf'] }
        },
        'docx': {
          description: 'Word documents',
          accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
        },
        'xlsx': {
          description: 'Excel spreadsheets',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        },
        'pptx': {
          description: 'PowerPoint presentations',
          accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] }
        }
      };

      // Show save file picker
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: `${this.getCleanFileName()}.${format}`,
        types: [fileTypeMap[format]]
      });

      // Write the file
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        throw error;
      }
      // User cancelled the save dialog
    }
  }

  private saveWithDownloadFallback(blob: Blob, format: string) {
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.getCleanFileName()}.${format}`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  private getCleanFileName(): string {
    // Remove invalid characters and ensure we have a valid filename
    const cleanName = this.documentName
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .trim() || 'Untitled Document';
    
    return cleanName;
  }

  private async getDocumentContentForExport(): Promise<string> {
    // In a real implementation, this would get the actual document content from the editor
    // For now, we'll return a mock content that represents the document
    
    return new Promise((resolve) => {
      // Try to get content from the editor if available
      const editorElement = document.querySelector('.tiptap');
      let content = '';
      
      if (editorElement) {
        // Get HTML content from the editor
        content = editorElement.innerHTML || '';
        
        // Convert HTML to plain text for non-HTML formats
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        content = tempDiv.textContent || tempDiv.innerText || '';
      }
      
      // If no content found, use default content
      if (!content.trim()) {
        content = `Document: ${this.documentName}\n\nCreated with Body Builder Document Editor\n\nThis document was exported on ${new Date().toLocaleString()}.`;
      }
      
      resolve(content);
    });
  }

  private generateFileContent(content: string, format: string): string {
    switch (format) {
      case 'pdf':
        // For PDF, we'd normally use a PDF library like jsPDF
        // For now, return a simple text representation
        return `%PDF-1.4\n% Document: ${this.documentName}\n% Content: ${content}\n% Generated by Body Builder Editor`;
        
      case 'docx':
        // For DOCX, we'd normally use a library like docx or PizZip
        // For now, return a simple XML structure
        return `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${this.escapeXml(content)}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
        
      case 'xlsx':
        // For XLSX, we'd normally use a library like SheetJS
        // For now, return a simple CSV-like content
        return `Document Name,Content,Export Date\n"${this.documentName}","${this.escapeCsv(content)}","${new Date().toISOString()}"`;
        
      case 'pptx':
        // For PPTX, we'd normally use a library like PptxGenJS
        // For now, return a simple XML structure
        return `<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMaster>
    <p:cSld>
      <p:spTree>
        <p:sp>
          <p:txBody>
            <a:p>
              <a:r>
                <a:t>${this.escapeXml(content)}</a:t>
              </a:r>
            </a:p>
          </p:txBody>
        </p:sp>
      </p:spTree>
    </p:cSld>
  </p:sldMaster>
</p:presentation>`;
        
      default:
        return content;
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeCsv(text: string): string {
    return text.replace(/"/g, '""');
  }

  onPrint() {
    // Prepare the document for printing
    this.preparePrintDocument();
    
    // Show print dialog after a brief delay to ensure content is ready
    setTimeout(() => {
      window.print();
    }, 100);
  }

  private preparePrintDocument() {
    // Get the current document content
    const editorElement = document.querySelector('.tiptap') as HTMLElement;
    
    if (!editorElement) {
      console.warn('No editor content found for printing');
      return;
    }

    // Create or update print styles
    this.addPrintStyles();
    
    // Set document title for print header
    const originalTitle = document.title;
    document.title = this.documentName || 'Untitled Document';
    
    // Add print-specific classes to the editor
    editorElement.classList.add('print-ready');
    
    // Restore original title after printing
    window.addEventListener('afterprint', () => {
      document.title = originalTitle;
      editorElement.classList.remove('print-ready');
    }, { once: true });
  }

  private addPrintStyles() {
    // Check if print styles already exist
    const existingStyles = document.getElementById('print-styles');
    if (existingStyles) {
      return;
    }

    // Create print-specific styles
    const printStyles = document.createElement('style');
    printStyles.id = 'print-styles';
    printStyles.textContent = `
      @media print {
        /* Hide everything except the document content */
        body * {
          visibility: hidden;
        }
        
        /* Show only the editor content and its children */
        .tiptap, .tiptap * {
          visibility: visible;
        }
        
        /* Position the editor content for printing */
        .tiptap {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 20mm !important;
          background: white !important;
          box-shadow: none !important;
          border: none !important;
          font-size: 12pt !important;
          line-height: 1.5 !important;
          color: black !important;
        }
        
        /* Ensure proper page breaks */
        .tiptap h1, .tiptap h2, .tiptap h3 {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        .tiptap p {
          page-break-inside: avoid;
          orphans: 3;
          widows: 3;
        }
        
        /* Table printing styles */
        .tiptap table {
          page-break-inside: avoid;
          border-collapse: collapse;
          width: 100%;
        }
        
        .tiptap td, .tiptap th {
          border: 1px solid #000;
          padding: 8px;
        }
        
        /* Image printing styles */
        .tiptap img {
          max-width: 100%;
          height: auto;
          page-break-inside: avoid;
        }
        
        /* Hide collaboration cursors and other UI elements */
        .collaboration-cursor__caret,
        .collaboration-cursor__label {
          display: none !important;
        }
        
        /* Print header with document name */
        @page {
          margin: 20mm;
          @top-center {
            content: "${this.documentName || 'Untitled Document'}";
            font-size: 10pt;
            font-weight: bold;
          }
          @bottom-center {
            content: "Page " counter(page) " of " counter(pages);
            font-size: 9pt;
          }
        }
        
        /* Ensure proper font rendering */
        .tiptap * {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        
        /* Handle code blocks */
        .tiptap pre {
          background: #f5f5f5 !important;
          border: 1px solid #ddd !important;
          padding: 10px !important;
          page-break-inside: avoid;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        /* Handle lists */
        .tiptap ul, .tiptap ol {
          page-break-inside: avoid;
        }
        
        .tiptap li {
          page-break-inside: avoid;
        }
        
        /* Handle blockquotes */
        .tiptap blockquote {
          border-left: 3px solid #ccc !important;
          margin: 10px 0 !important;
          padding-left: 15px !important;
          page-break-inside: avoid;
        }
      }
    `;
    
    document.head.appendChild(printStyles);
  }

  openRecentDocuments() {
    // Navigate to file manager
    window.location.href = '/file/manager';
  }

  uploadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.doc,.docx,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.fileService.uploadFile(file).subscribe(
          (response: any) => {
            console.log('File uploaded successfully:', response);
            this.showSaveNotification('File uploaded successfully');
          },
          (error: any) => {
            console.error('File upload failed:', error);
            this.showSaveNotification('File upload failed', 'error');
          }
        );
      }
    };
    input.click();
  }

  onShare() {
    this.share.emit();
  }
}