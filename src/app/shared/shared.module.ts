import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ShareDialogComponent } from './components/share-dialog/share-dialog.component';
import { ImageEditDialogComponent } from './components/image-edit-dialog/image-edit-dialog.component';
import { CommentsSidebarComponent } from './components/comments-sidebar/comments-sidebar.component';

// Import File Module components
import { FileModule } from '../features/file/file.module';

@NgModule({
  declarations: [
    ToolbarComponent,
    ShareDialogComponent,
    ImageEditDialogComponent,
    CommentsSidebarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FileModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ToolbarComponent,
    ShareDialogComponent,
    ImageEditDialogComponent,
    CommentsSidebarComponent
  ]
})
export class SharedModule { }