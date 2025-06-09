import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FileRoutingModule } from './file-routing.module';

import { FileManagerComponent } from './components/file-manager/file-manager.component';
import { FileToolbarComponent } from './components/file-toolbar/file-toolbar.component';

@NgModule({
  declarations: [
    FileManagerComponent,
    FileToolbarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FileRoutingModule
  ],
  exports: [
    FileToolbarComponent
  ]
})
export class FileModule { }