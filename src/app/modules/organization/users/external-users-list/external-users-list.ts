import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IamService } from '@/core/services/iam.service';
import { AuthorizationResponse } from '@/core/services/iam.interface';
import { OrganizationService } from '@/auth/organization.service';
import { AppConfigService } from '@/config/app-config.service';

@Component({
  selector: 'app-external-users-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    AvatarModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="card">
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 class="text-xl font-bold m-0 text-surface-700">External Access</h2>
          <p class="text-surface-500 m-0">
            Users from other organizations with access to this project.
          </p>
        </div>
        <p-button
          icon="pi pi-refresh"
          [text]="true"
          [rounded]="true"
          severity="secondary"
          (onClick)="loadExternalUsers()"
          pTooltip="Refresh List"
          tooltipPosition="left"
        />
      </div>

      <p-table
        [value]="externalUsers()"
        [loading]="loading()"
        [rows]="10"
        [paginator]="true"
        [rowsPerPageOptions]="[10, 25, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
        dataKey="id"
        styleClass="p-datatable-sm"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 40%">User</th>
            <th style="width: 35%">Organization</th>
            <th style="width: 15%">Created</th>
            <th style="width: 10%">Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-auth>
          <tr>
            <td>
              <div class="flex items-center gap-2">
                <p-avatar
                  [image]="auth.user.avatarUrl"
                  [label]="!auth.user.avatarUrl ? getInitials(auth) : undefined"
                  shape="circle"
                  styleClass="{{
                    !auth.user.avatarUrl ? 'bg-indigo-100 text-indigo-700 font-bold' : ''
                  }}"
                />
                <div class="flex flex-col">
                  <span class="font-medium">{{ auth.user.displayName }}</span>
                  <span class="text-sm text-surface-500">{{ auth.user.preferredLoginName }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <i class="pi pi-building text-surface-400"></i>
                <span>{{ auth.organization.name }}</span>
              </div>
            </td>
            <td>{{ auth.creationDate | date: 'mediumDate' }}</td>
            <td>
              <p-button
                icon="pi pi-times"
                [rounded]="true"
                [text]="true"
                severity="danger"
                (onClick)="revokeAccess(auth)"
                pTooltip="Revoke Access"
                tooltipPosition="top"
              />
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="text-center p-8">
              <div class="flex flex-col items-center gap-3 text-surface-400">
                <i class="pi pi-users text-4xl"></i>
                <span>No external users found.</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog
      header="Revoke Access"
      icon="pi pi-exclamation-triangle"
      acceptButtonStyleClass="p-button-danger"
      rejectButtonStyleClass="p-button-secondary p-button-text"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalUsersList implements OnInit {
  private iamService = inject(IamService);
  private orgService = inject(OrganizationService);
  private configService = inject(AppConfigService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  externalUsers = signal<AuthorizationResponse[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadExternalUsers();
  }

  loadExternalUsers() {
    const orgId = this.orgService.activeOrganizationId();
    const projectId = this.configService.idp().projectId;

    if (!orgId || !projectId) return;

    this.loading.set(true);
    this.iamService
      .getExternalUsers({
        projectId: projectId,
        excludeOrganizationId: orgId,
      })
      .subscribe({
        next: (users) => {
          this.externalUsers.set(users);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load external users', err);
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load external users',
          });
        },
      });
  }

  revokeAccess(auth: AuthorizationResponse) {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke access for ${auth.user.displayName}?`,
      accept: () => {
        this.iamService.deleteAuthorization(auth.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Access revoked successfully',
            });
            this.loadExternalUsers();
          },
          error: (err) => {
            console.error('Failed to revoke access', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to revoke access',
            });
          },
        });
      },
    });
  }

  getInitials(auth: AuthorizationResponse): string {
    return auth.user.displayName?.charAt(0).toUpperCase() || '?';
  }
}
