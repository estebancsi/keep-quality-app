import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./system-list/system-list').then((m) => m.SystemList),
  },
  {
    path: 'lifecycle',
    loadComponent: () => import('./lifecycle-list/lifecycle-list').then((m) => m.LifecycleList),
  },
  {
    path: 'lifecycle/:projectId',
    loadComponent: () =>
      import('./lifecycle-project-detail/lifecycle-project-detail').then(
        (m) => m.LifecycleProjectDetail,
      ),
  },
  {
    path: 'lifecycle/:projectId/attachments',
    loadComponent: () =>
      import('./lifecycle-attachments/lifecycle-attachments').then((m) => m.LifecycleAttachments),
  },
  {
    path: 'system-impact-template',
    loadComponent: () =>
      import('./system-impact-template/system-impact-template.component').then(
        (m) => m.SystemImpactTemplateComponent,
      ),
  },
] as Routes;
