import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { OrganizationService } from '../../auth/organization.service';

export const organizationInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const organizationService = inject(OrganizationService);
  const activeOrgId = organizationService.activeOrganizationId();

  if (activeOrgId) {
    req = req.clone({
      setHeaders: {
        'X-Organization-Id': activeOrgId,
      },
    });
  }

  return next(req);
};
