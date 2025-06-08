import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

interface ImageEdit {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotation: number;
}

@Component({
  selector: 'app-image-edit-dialog',
  templateUrl: './image-edit-dialog.component.html',
  styleUrls: ['./image-edit-dialog.component.css']
})
export class ImageEditDialogComponent implements OnInit {
  @Input() selectedImage: any;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ImageEdit>();

  imageEdit: ImageEdit = {
    src: '',
    width: 0,
    height: 0,
    alt: '',
    title: '',
    flipHorizontal: false,
    flipVertical: false,
    rotation: 0
  };

  private originalWidth = 0;
  private originalHeight = 0;
  private aspectRatio = 1;

  resizeHandles = [
    { top: 0, left: 0, type: 'nw' },
    { top: 0, left: '50%', type: 'n' },
    { top: 0, left: '100%', type: 'ne' },
    { top: '50%', left: 0, type: 'w' },
    { top: '50%', left: '100%', type: 'e' },
    { top: '100%', left: 0, type: 'sw' },
    { top: '100%', left: '50%', type: 's' },
    { top: '100%', left: '100%', type: 'se' }
  ];

  ngOnInit() {
    if (this.selectedImage) {
      const img = new Image();
      img.onload = () => {
        this.originalWidth = img.width;
        this.originalHeight = img.height;
        this.aspectRatio = this.originalWidth / this.originalHeight;
        
        this.imageEdit = {
          ...this.imageEdit,
          src: this.selectedImage.src,
          width: this.originalWidth,
          height: this.originalHeight,
          alt: this.selectedImage.alt || '',
          title: this.selectedImage.title || ''
        };
      };
      img.src = this.selectedImage.src;
    }
  }

  getTransform(): string {
    const transforms = [];
    if (this.imageEdit.flipHorizontal) transforms.push('scaleX(-1)');
    if (this.imageEdit.flipVertical) transforms.push('scaleY(-1)');
    if (this.imageEdit.rotation) transforms.push(`rotate(${this.imageEdit.rotation}deg)`);
    return transforms.join(' ');
  }

  maintainAspectRatio(changedDimension: 'width' | 'height') {
    if (changedDimension === 'width') {
      this.imageEdit.height = Math.round(this.imageEdit.width! / this.aspectRatio);
    } else {
      this.imageEdit.width = Math.round(this.imageEdit.height! * this.aspectRatio);
    }
  }

  resetSize() {
    this.imageEdit.width = this.originalWidth;
    this.imageEdit.height = this.originalHeight;
  }

  rotate(degrees: number) {
    this.imageEdit.rotation = ((this.imageEdit.rotation || 0) + degrees) % 360;
  }

  startResize(event: MouseEvent, handleType: string) {
    // Implement resize logic
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = this.imageEdit.width!;
    const startHeight = this.imageEdit.height!;

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      switch (handleType) {
        case 'se':
          this.imageEdit.width = startWidth + deltaX;
          this.maintainAspectRatio('width');
          break;
        case 'sw':
          this.imageEdit.width = startWidth - deltaX;
          this.maintainAspectRatio('width');
          break;
        case 'ne':
          this.imageEdit.width = startWidth + deltaX;
          this.maintainAspectRatio('width');
          break;
        case 'nw':
          this.imageEdit.width = startWidth - deltaX;
          this.maintainAspectRatio('width');
          break;
        // Add other cases as needed
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  saveChanges() {
    this.save.emit(this.imageEdit);
    this.close.emit();
  }
} 