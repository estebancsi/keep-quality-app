import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./system-list/system-list').then((m) => m.SystemList),
  },
] as Routes;
