import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../../auth/organization.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
  selector: 'app-org-switcher',
  standalone: true,
  imports: [CommonModule, SelectModule, FormsModule],
  template: `
    @if (isAuthenticated()) {
      <p-select
        [options]="orgService.organizations()"
        [ngModel]="currentOrgId"
        (ngModelChange)="onOrgChange($event)"
        optionLabel="name"
        optionValue="id"
        placeholder="Select Organization"
        styleClass="w-full md:w-56"
        class="mr-2"
      >
      </p-select>
    }
  `,
})
export class OrgSwitcherComponent implements OnInit {
  orgService = inject(OrganizationService);
  oidcSecurityService = inject(OidcSecurityService);

  currentOrgId: string | undefined;
  isAuthenticated = signal(false);

  ngOnInit() {
    this.oidcSecurityService.isAuthenticated$.subscribe(({ isAuthenticated }) => {
      this.isAuthenticated.set(isAuthenticated);
      if (isAuthenticated) {
        this.orgService.loadOrganizations().subscribe((orgs) => {
          const activeOrgId = this.orgService.activeOrganizationId();
          const activeOrg = orgs.find((o) => o.id === activeOrgId);
          const defaultOrg = orgs[0];

          if (activeOrg) {
            this.currentOrgId = activeOrg.id;
          } else if (defaultOrg) {
            this.currentOrgId = defaultOrg.id;
          }
        });
      }
    });
  }

  onOrgChange(orgId: string) {
    if (orgId && orgId !== this.currentOrgId) {
      this.orgService.switchOrganization(orgId);
    }
  }
}

import { signal } from '@angular/core';
