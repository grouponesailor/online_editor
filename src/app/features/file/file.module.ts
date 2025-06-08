import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FileRoutingModule } from './file-routing.module';
import { FileService } from './services/file.service';

import { FileManagerComponent } from './components/file-manager/file-manager.component';

@NgModule({
  declarations: [
    FileManagerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FileRoutingModule
  ],
  providers: [
    FileService
  ],
  exports: []
})
export class FileModule { }