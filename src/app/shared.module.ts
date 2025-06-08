import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';
import { SafeHtmlPipe } from './shared/pipes/safe-html.pipe';

@NgModule({
  declarations: [
    ToolbarComponent,
    SafeHtmlPipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ToolbarComponent,
    SafeHtmlPipe,
    CommonModule,
    FormsModule
  ]
})
export class SharedModule { } 