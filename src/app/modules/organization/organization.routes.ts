import { Routes } from '@angular/router';

export default [
  {
    path: 'settings',
    loadComponent: () =>
      import('./organization-settings/organization-settings').then((m) => m.OrganizationSettings),
  },
  {
    path: 'users',
    loadComponent: () => import('./users/users-list/users-list').then((m) => m.UsersList),
  },
] as Routes;
