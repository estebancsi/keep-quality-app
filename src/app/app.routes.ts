import { Routes } from '@angular/router';
import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';
import { AppLayout } from './layout/components/app.layout';
import { LandingLayout } from './layout/components/app.landinglayout';
import { LandingPage } from './pages/landing/landingpage';
import { FeaturesPage } from './pages/landing/featurespage';
import { PricingPage } from './pages/landing/pricingpage';
import { ContactPage } from './pages/landing/contactpage';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    component: LandingLayout,
    children: [
      { path: '', component: LandingPage },
      { path: 'features', component: FeaturesPage },
      { path: 'pricing', component: PricingPage },
      { path: 'contact', component: ContactPage },
    ],
  },
  { path: 'auth', loadChildren: () => import('./auth/auth.routes') },
  {
    path: 'home',
    component: AppLayout,
    canActivate: [autoLoginPartialRoutesGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
    ],
  },
  {
    path: 'organization',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./modules/organization/organization.routes'),
      },
    ],
  },
  {
    path: 'pdf-templates',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    loadChildren: () => import('./modules/pdf-templates/pdf-templates.routes'),
  },
  {
    path: 'pdf-viewer',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@/shared/components/pdf-viewer/pdf-viewer.component').then(
            (m) => m.PdfViewerComponent,
          ),
      },
    ],
  },
  {
    path: 'csv',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    loadChildren: () => import('./modules/csv/csv.routes'),
  },
  {
    path: 'oops',
    loadComponent: () => import('./pages/oops/oops').then((m) => m.Oops),
  },
  {
    path: 'notfound',
    loadComponent: () => import('./pages/notfound/notfound').then((m) => m.Notfound),
  },
  {
    path: 'custom-fields',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    loadChildren: () => import('./shared/custom-fields/custom-fields.routes'),
  },
  {
    path: 'audit-trail',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/audit-trail/audit-trail-page.component').then(
            (m) => m.AuditTrailPageComponent,
          ),
      },
    ],
  },
  {
    path: 'ai-chat',
    component: AppLayout,
    canActivateChild: [autoLoginPartialRoutesGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/ai-chat/ai-chat.component').then((m) => m.AiChatComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'notfound' },
];
