import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="min-h-screen">
      <header class="bg-white border-b">
        <!-- Container and logo removed -->
      </header>

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {
  title = 'Collaborative Document Editor';
}