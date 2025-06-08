import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { FileService } from '../../../features/file/services/file.service';

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
        } else {
          this.showSaveNotification('Failed to save document', 'error');
        }
      }
    );
    
    // Also emit the save event for parent components
    this.saveDocument.emit();
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
    return this.documentName.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private async getDocumentContentForExport(): Promise<string> {
    // Get the editor content
    const editorContent = document.querySelector('.editor-content');
    if (!editorContent) {
      throw new Error('Editor content not found');
    }
    return editorContent.innerHTML;
  }

  private generateFileContent(content: string, format: string): string {
    switch (format) {
      case 'pdf':
        return `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${this.escapeXml(this.documentName)}</title>
              <style>
                body { font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              ${content}
            </body>
          </html>
        `;
      case 'docx':
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <?mso-application progid="Word.Document"?>
          <w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml">
            <w:body>
              ${this.escapeXml(content)}
            </w:body>
          </w:wordDocument>`;
      case 'xlsx':
        return this.escapeCsv(content);
      case 'pptx':
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
          <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
            <p:sldMaster>
              <p:cSld>
                <p:spTree>
                  <p:sp>
                    <p:txBody>
                      <a:p>
                        ${this.escapeXml(content)}
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
    return text.replace(/"/g, '""').replace(/\n/g, '\r\n');
  }

  onPrint() {
    this.preparePrintDocument();
    window.print();
  }

  private preparePrintDocument() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.showSaveNotification('Failed to open print window', 'error');
      return;
    }

    // Get the editor content
    const editorContent = document.querySelector('.editor-content');
    if (!editorContent) {
      printWindow.close();
      this.showSaveNotification('Editor content not found', 'error');
      return;
    }

    // Write the document content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.documentName}</title>
          ${this.addPrintStyles()}
        </head>
        <body>
          <div class="document-content">
            ${editorContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    // Close the document writing
    printWindow.document.close();

    // Wait for resources to load then print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }

  private addPrintStyles(): string {
    return `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }

          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: #000;
          }

          .document-content {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }

          /* Headers */
          h1 { font-size: 24pt; }
          h2 { font-size: 20pt; }
          h3 { font-size: 16pt; }
          h4 { font-size: 14pt; }
          h5 { font-size: 12pt; }
          h6 { font-size: 10pt; }

          /* Lists */
          ul, ol {
            margin: 12pt 0;
            padding-left: 24pt;
          }

          li {
            margin: 6pt 0;
          }

          /* Tables */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
          }

          th, td {
            border: 1pt solid #000;
            padding: 6pt;
          }

          /* Images */
          img {
            max-width: 100%;
            height: auto;
          }

          /* Page breaks */
          h1, h2, h3, table, img {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          /* Links */
          a {
            color: #000;
            text-decoration: underline;
          }

          /* Hide UI elements */
          .toolbar,
          .sidebar,
          .comments,
          .no-print {
            display: none !important;
          }
        }

        /* Preview styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.5;
          color: #000;
          max-width: 210mm;
          margin: 0 auto;
          padding: 2cm;
          background: #fff;
        }

        .document-content {
          background: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          padding: 2cm;
          min-height: 297mm;
        }
      </style>
    `;
  }

  openRecentDocuments() {
    // Implement recent documents functionality
    console.log('Opening recent documents...');
  }

  uploadFile() {
    // Implement file upload functionality
    console.log('Uploading file...');
  }
} 