import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FileManagerComponent } from './components/file-manager/file-manager.component';

const routes: Routes = [
  { path: '', component: FileManagerComponent },
  { path: 'manager', component: FileManagerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FileRoutingModule { }