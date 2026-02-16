import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
} from '@angular/router';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import {
  provideAuth,
  authInterceptor,
  withAppInitializerAuthCheck,
} from 'angular-auth-oidc-client';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { authConfig } from './auth/auth.config';
import { routes } from './app.routes';
import { AppConfigService } from './config/app-config.service';
import { MessageService } from 'primeng/api';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{cyan.50}',
      100: '{cyan.100}',
      200: '{cyan.200}',
      300: '{cyan.300}',
      400: '{cyan.400}',
      500: '{cyan.500}',
      600: '{cyan.600}',
      700: '{cyan.700}',
      800: '{cyan.800}',
      900: '{cyan.900}',
      950: '{cyan.950}',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
      withEnabledBlockingInitialNavigation(),
    ),
    provideAppInitializer(() => {
      const appConfigService = inject(AppConfigService);
      return appConfigService.loadConfig();
    }),
    provideAuth(authConfig, withAppInitializerAuthCheck()),
    provideHttpClient(withInterceptors([authInterceptor()])),
    provideMonacoEditor(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
          darkModeSelector: '.app-dark',
        },
      },
    }),
    MessageService,
  ],
};
