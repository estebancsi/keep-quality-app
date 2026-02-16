import {
  LogLevel,
  OpenIdConfiguration,
  PassedInitialConfig,
  StsConfigHttpLoader,
  StsConfigLoader,
} from 'angular-auth-oidc-client';
import { filter, map, Observable, take, throwError, timeout, timer } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';

const waitForConfig$ = (
  configService: AppConfigService,
  maxAttempts = 50,
): Observable<OpenIdConfiguration> => {
  return timer(0, 50).pipe(
    filter(() => configService.isConfigLoaded),
    take(1),
    map(() => {
      const config = configService.oidc();
      return {
        authority: config.authority,
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        postLoginRoute: '/auth/callback',
        forbiddenRoute: '/forbidden',
        unauthorizedRoute: '/unauthorized',
        clientId: config.clientId,
        scope: config.scope,
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        renewTimeBeforeTokenExpiresInSeconds: 30,
        logLevel: LogLevel.Debug,
        secureRoutes: config.secureRoutes,
      };
    }),
    timeout({
      each: maxAttempts * 50,
      with: () => {
        console.error('❌ Config failed to load after waiting');
        return throwError(() => new Error('Config failed to load after waiting'));
      },
    }),
  );
};

const authFactory = (configService: AppConfigService) => {
  return new StsConfigHttpLoader(waitForConfig$(configService));
};

export const authConfig: PassedInitialConfig = {
  loader: {
    provide: StsConfigLoader,
    useFactory: authFactory,
    deps: [AppConfigService],
  },
};
