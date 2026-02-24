import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { OrganizationService } from '@/auth/organization.service';
import { AppConfigService } from '@/config/app-config.service';

export const organizationInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const organizationService = inject(OrganizationService);
  const appConfigService = inject(AppConfigService);
  const activeOrgId = organizationService.activeOrganizationId();

  // Only process if we have an active org ID and config is loaded
  if (activeOrgId && appConfigService.isConfigLoaded) {
    const apiUrl = appConfigService.apiUrl();
    const apiReportsUrl = appConfigService.apiReportsUrl();

    // Only add the header for our own API requests
    const isApiRequest =
      (apiUrl && req.url.startsWith(apiUrl)) ||
      (apiReportsUrl && req.url.startsWith(apiReportsUrl));

    if (isApiRequest) {
      req = req.clone({
        setHeaders: {
          'X-Organization-Id': activeOrgId,
        },
      });
    }
  }

  return next(req);
};
