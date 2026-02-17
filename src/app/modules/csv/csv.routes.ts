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
] as Routes;
