import { Component, inject, OnInit } from '@angular/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { Router } from '@angular/router';
import { OrganizationService, Organization } from '../organization.service';

@Component({
  selector: 'app-callback',
  imports: [],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="flex flex-col items-center gap-4">
        <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
        <p class="text-surface-600 dark:text-surface-400">Completing sign in...</p>
      </div>
    </div>
  `,
})
export class Callback implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly router = inject(Router);
  private readonly orgService = inject(OrganizationService);

  ngOnInit() {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated }) => {
      if (isAuthenticated) {
        const activeOrgId = this.orgService.activeOrganizationId();

        if (!activeOrgId) {
          this.orgService.loadOrganizations().subscribe({
            next: (orgs: Organization[]) => {
              if (orgs.length > 0) {
                // Determine target organization (default or first)
                // Note: isDefault was removed from interface, so we take the first one.
                const targetOrgId = orgs[0].id;

                // Preserve existing returnUrl to avoid overwriting it with /auth/callback
                // inside switchOrganization and causing a loop.
                const preservedReturnUrl = localStorage.getItem('returnUrl');

                this.orgService.switchOrganization(targetOrgId);

                // Restore the original returnUrl so the user goes where they intended
                // after the second auth callback.
                if (preservedReturnUrl) {
                  localStorage.setItem('returnUrl', preservedReturnUrl);
                } else {
                  // If no returnUrl existed, ensure we don't get stuck in callback
                  localStorage.setItem('returnUrl', '/home');
                }
              } else {
                // User has no organizations, proceed to home (or error page?)
                this.navigateNext();
              }
            },
            error: (err: any) => {
              console.error('Failed to load organizations in callback', err);
              this.navigateNext();
            },
          });
        } else {
          this.navigateNext();
        }
      }
    });
  }

  private navigateNext() {
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
