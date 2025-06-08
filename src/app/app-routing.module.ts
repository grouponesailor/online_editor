import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: '/documents/new', pathMatch: 'full' },
  { 
    path: 'documents', 
    loadChildren: () => import('./features/editor/editor.module').then(m => m.EditorModule)
  },
  { 
    path: 'documents', 
    loadChildren: () => import('./features/editor/editor.module').then(m => m.EditorModule)
  },
  { 
    path: 'file', 
    loadChildren: () => import('./features/file/file.module').then(m => m.FileModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }