import { Routes } from '@angular/router';

export const SYSTEM_PROMPTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/system-prompts-list/system-prompts-list.component').then(
        (m) => m.SystemPromptsListComponent,
      ),
  },
];
