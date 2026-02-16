import { Routes } from '@angular/router';

export default [
  {
    path: '',
    redirectTo: 'editor',
    pathMatch: 'full' as const,
  },
  {
    path: 'editor',
    loadComponent: () => import('./template-editor/template-editor').then((m) => m.TemplateEditor),
  },
] as Routes;
