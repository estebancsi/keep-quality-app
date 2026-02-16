import { Injectable, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Observable, map, tap, filter } from 'rxjs';
import { AppConfigService } from '@/config/app-config.service';

export interface Organization {
  id: string;
  name: string;
}

export interface RegistrationPayload {
  organization: {
    name: string;
    country: string;
    website?: string;
    purpose: string;
  };
  user: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private oidcSecurityService = inject(OidcSecurityService);
  private appConfigService = inject(AppConfigService);

  readonly organizations = signal<Organization[]>([]);
  private readonly userData = toSignal(this.oidcSecurityService.userData$);

  readonly activeOrganizationId = computed(() => {
    const data = this.userData();
    const orgId = data?.userData?.['urn:zitadel:iam:org:id'];

    if (orgId) return orgId;

    const orgs = this.organizations();
    return orgs.length > 0 ? orgs[0].id : undefined;
  });

  loadOrganizations(): Observable<Organization[]> {
    return this.http
      .get<{
        data: Organization[];
      }>(`${this.appConfigService.apiUrl()}/api/v1/iam/me/organizations`)
      .pipe(
        map((res) => res.data),
        tap((orgs) => this.organizations.set(orgs)),
      );
  }

  register(payload: RegistrationPayload): Observable<any> {
    return this.http.post(`${this.appConfigService.apiUrl()}/api/v1/registrations`, payload);
  }

  switchOrganization(orgId: string) {
    const currentUrl = this.router.url;
    localStorage.setItem('returnUrl', currentUrl);

    const scope = [
      this.appConfigService.oidcDefaultScope,
      this.appConfigService.oidc().scope,
      `urn:zitadel:iam:org:id:${orgId}`,
    ].join(' ');
    this.oidcSecurityService.authorize(undefined, {
      customParams: {
        scope: scope,
      },
    });
  }
}
