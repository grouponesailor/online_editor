import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FileRoutingModule } from './file-routing.module';

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
  exports: []
})
export class FileModule { }