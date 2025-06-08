import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EditorRoutingModule } from './editor-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { EditorComponent } from './components/editor/editor.component';

@NgModule({
  declarations: [
    EditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    EditorRoutingModule
  ]
})
export class EditorModule { } 