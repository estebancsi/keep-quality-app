import { Route } from '@angular/router';
import { Callback } from './callback/callback';

export default [
  { path: '', pathMatch: 'full', redirectTo: '/' },
  { path: 'callback', component: Callback },
  {
    path: 'register',
    loadComponent: () =>
      import('../pages/auth/registration/registration.component').then(
        (m) => m.RegistrationComponent,
      ),
  },
  {
    path: 'access',
    loadComponent: () => import('@/pages/auth/access').then((m) => m.Access),
  },
] as Route[];
