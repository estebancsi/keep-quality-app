import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./send-notification-page').then((m) => m.SendNotificationPage),
  },
] as Routes;
