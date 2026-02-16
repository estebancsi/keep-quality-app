import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { TabsModule } from 'primeng/tabs';
import { UsersService } from '../users.service';
import { User, UserSearchRequest } from '../users.interface';
import { UserFormDialog } from '../user-form-dialog/user-form-dialog';
import { ResetPasswordDialog } from '../reset-password-dialog/reset-password-dialog';
import { ExternalUsersList } from '../external-users-list/external-users-list';
import { OrganizationService } from '@/auth/organization.service';
import { IamService } from '@/core/services/iam.service';
import { AuthorizationResponse } from '@/core/services/iam.interface';
import { AppConfigService } from '@/config/app-config.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputIconModule,
    TooltipModule,
    AvatarModule,
    TabsModule,
    UserFormDialog,
    ResetPasswordDialog,
    ExternalUsersList,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="card p-4">
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 class="text-2xl font-bold m-0">Users</h2>
          <p class="text-surface-500 m-0">Manage organization members and access.</p>
        </div>
        <p-button label="New User" icon="pi pi-plus" (onClick)="openCreateDialog()" />
      </div>

      <p-tabs value="members">
        <p-tablist>
          <p-tab value="members">
            <i class="pi pi-users mr-2"></i>
            Members
          </p-tab>
          <p-tab value="external">
            <i class="pi pi-external-link mr-2"></i>
            External Access
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <p-tabpanel value="members">
            <p-table
              #dt
              [value]="users()"
              [lazy]="true"
              (onLazyLoad)="loadUsers($event)"
              [totalRecords]="totalRecords()"
              [loading]="loading()"
              [rows]="10"
              [paginator]="true"
              [rowsPerPageOptions]="[10, 25, 50]"
              [showCurrentPageReport]="true"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
              dataKey="id"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="caption">
                <div class="flex justify-between items-center">
                  <p-iconField iconPosition="left">
                    <p-inputIcon styleClass="pi pi-search" />
                    <input
                      pInputText
                      type="text"
                      (input)="onGlobalFilter($event)"
                      placeholder="Search by email..."
                    />
                  </p-iconField>
                  <p-button
                    icon="pi pi-refresh"
                    [text]="true"
                    [rounded]="true"
                    severity="secondary"
                    (onClick)="refresh()"
                    pTooltip="Refresh List"
                    tooltipPosition="left"
                  />
                </div>
              </ng-template>

              <ng-template pTemplate="header">
                <tr>
                  <th style="width: 25%">User</th>
                  <th style="width: 25%">Full Name</th>
                  <th style="width: 15%">Status</th>
                  <th style="width: 15%">Access</th>
                  <th style="width: 10%">Created</th>
                  <th style="width: 10%">Actions</th>
                </tr>
              </ng-template>

              <ng-template pTemplate="body" let-user>
                <tr>
                  <td>
                    <div class="flex items-center gap-2">
                      <p-avatar
                        [image]="user.profile.avatarUrl"
                        [label]="!user.profile.avatarUrl ? getInitials(user) : undefined"
                        shape="circle"
                        styleClass="{{
                          !user.profile.avatarUrl ? 'bg-indigo-100 text-indigo-700 font-bold' : ''
                        }}"
                      />
                      <div class="flex flex-col">
                        <span class="font-medium">{{ user.username }}</span>
                        <span class="text-sm text-surface-500">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.profile.fullName }}</td>
                  <td>
                    <p-tag
                      [value]="user.status"
                      [severity]="getSeverity(user.status)"
                      [rounded]="true"
                    />
                  </td>
                  <td>
                    @if (hasAccess(user)) {
                      <p-tag
                        severity="success"
                        [rounded]="true"
                        styleClass="group transition-all duration-200"
                      >
                        <div class="flex items-center gap-2 px-1">
                          <i class="pi pi-check text-[10px]"></i>
                          <span class="text-xs font-bold uppercase tracking-wider">Granted</span>
                          <i
                            class="pi pi-times text-[10px] ml-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:text-red-600"
                            (click)="revokeAccess(user); $event.stopPropagation()"
                            pTooltip="Revoke Access"
                            tooltipPosition="top"
                          ></i>
                        </div>
                      </p-tag>
                    } @else {
                      <p-button
                        label="Grant Access"
                        icon="pi pi-lock-open"
                        size="small"
                        [text]="true"
                        severity="primary"
                        (onClick)="grantAccess(user)"
                      />
                    }
                  </td>
                  <td>{{ user.createdAt | date: 'mediumDate' }}</td>
                  <td>
                    <div class="flex gap-2">
                      <p-button
                        icon="pi pi-pencil"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        (onClick)="openEditDialog(user)"
                        pTooltip="Edit"
                      />
                      <p-button
                        icon="pi pi-key"
                        [rounded]="true"
                        [text]="true"
                        severity="warn"
                        (onClick)="openResetPasswordDialog(user)"
                        pTooltip="Reset Password"
                      />
                      <p-button
                        icon="pi pi-trash"
                        [rounded]="true"
                        [text]="true"
                        severity="danger"
                        (onClick)="confirmDelete(user)"
                        pTooltip="Deactivate"
                      />
                    </div>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="text-center p-4">No users found.</td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel>

          <p-tabpanel value="external">
            <app-external-users-list />
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>

    <!-- Dialogs -->
    <app-user-form-dialog
      [(visible)]="showUserDialog"
      [(user)]="selectedUser"
      (saved)="refresh()"
    />

    <app-reset-password-dialog [(visible)]="showResetPasswordDialog" [(userId)]="selectedUserId" />

    <p-confirmDialog
      header="Confirmation"
      icon="pi pi-exclamation-triangle"
      acceptButtonStyleClass="p-button-danger"
      rejectButtonStyleClass="p-button-secondary p-button-text"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersList {
  private usersService = inject(UsersService);
  private orgService = inject(OrganizationService);
  private iamService = inject(IamService); // Inject IamService
  private configService = inject(AppConfigService); // Inject AppConfigService
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  users = signal<User[]>([]);
  totalRecords = signal(0);
  loading = signal(true);
  externalList = viewChild(ExternalUsersList);

  // Authorizations state
  authorizations = signal<Record<string, AuthorizationResponse>>({});

  // Filters state
  lastLazyLoadEvent = signal<TableLazyLoadEvent | null>(null);
  searchValue = signal<string>('');

  // Dialog state
  showUserDialog = signal(false);
  showResetPasswordDialog = signal(false);
  selectedUser = signal<User | null>(null);
  selectedUserId = signal<string | null>(null); // For reset password

  // Helper properties
  get currentProjectId() {
    return this.configService.idp().projectId;
  }

  loadUsers(event: TableLazyLoadEvent) {
    this.lastLazyLoadEvent.set(event);
    this.loading.set(true);

    const request: UserSearchRequest = {
      limit: event.rows || 10,
      offset: event.first || 0,
      orderBy: getTypeSafeField(event.sortField as string) || 'created_at',
      ascending: false, // event.sortOrder === 1
      email: this.searchValue() || undefined, // Simple search by email for now
    };

    this.usersService.searchUsers(request).subscribe({
      next: (res) => {
        this.users.set(res.items);
        this.totalRecords.set(res.total);
        this.loading.set(false);
        this.loadAuthorizations(); // Load authorizations after users
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.loading.set(false);
      },
    });
  }

  loadAuthorizations() {
    const orgId = this.orgService.activeOrganizationId();
    if (!orgId) return;

    const userIds = this.users()
      .map((u) => u.idpUserId)
      .filter((id): id is string => !!id);

    if (userIds.length === 0) {
      this.authorizations.set({});
      return;
    }

    this.iamService
      .getAuthorizations({
        projectId: this.currentProjectId,
        organizationId: orgId,
        userIds,
        limit: 100,
      })
      .subscribe({
        next: (auths) => {
          const authMap: Record<string, AuthorizationResponse> = {};
          auths.forEach((auth) => {
            // Check if auth.user.id is compatible with format
            if (auth.user.id) {
              authMap[auth.user.id] = auth;
            }
          });
          this.authorizations.set(authMap);
        },
        error: (err) => {
          console.error('Failed to load authorizations', err);
        },
      });
  }

  hasAccess(user: User): boolean {
    if (!user.idpUserId) return false;
    return !!this.authorizations()[user.idpUserId];
  }

  grantAccess(user: User) {
    if (!user.idpUserId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User has no Identity Provider ID',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Grant access to ${user.username} for this project?`,
      header: 'Grant Access',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.iamService
          .createAuthorization({
            userId: user.idpUserId!,
            projectId: this.currentProjectId,
            organizationId: this.orgService.activeOrganizationId() || '',
          })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Access granted',
              });
              this.loadAuthorizations();
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to grant access',
              });
            },
          });
      },
    });
  }

  revokeAccess(user: User) {
    const auth = this.authorizations()[user.idpUserId!];
    if (!auth) return;

    this.confirmationService.confirm({
      message: `Revoke access for ${user.username}?`,
      header: 'Revoke Access',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.iamService.deleteAuthorization(auth.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Access revoked',
            });
            this.loadAuthorizations();
          },
          error: (err) => {
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

  refresh() {
    const event = this.lastLazyLoadEvent();
    if (event) {
      this.loadUsers(event);
    } else {
      // Trigger initial load if no event yet
      this.loadUsers({ first: 0, rows: 10 });
    }

    // Also refresh external users if the component is available
    this.externalList()?.loadExternalUsers();
  }

  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue.set(value);
    // Debounce could be added here, but input event triggering lazy load via
    // refresh or similar mechanism is needed.
    // For lazy table, filtering usually triggers 'onLazyLoad'.
    // We can manually trigger it or just call refresh() with reset offset.
    const lastEvent = this.lastLazyLoadEvent();
    if (lastEvent) {
      this.loadUsers({ ...lastEvent, first: 0 });
    }
  }

  openCreateDialog() {
    this.selectedUser.set(null);
    this.showUserDialog.set(true);
  }

  openEditDialog(user: User) {
    this.selectedUser.set(user);
    this.showUserDialog.set(true);
  }

  openResetPasswordDialog(user: User) {
    this.selectedUserId.set(user.id);
    this.showResetPasswordDialog.set(true);
  }

  confirmDelete(user: User) {
    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate ${user.profile.fullName}?`,
      accept: () => {
        this.deactivateUser(user.id);
      },
    });
  }

  deactivateUser(id: string) {
    this.usersService.deactivateUser(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deactivated',
        });
        this.refresh();
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to deactivate user',
        });
      },
    });
  }

  getSeverity(status: string) {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'banned':
      case 'suspended':
        return 'danger';
      case 'inactive':
        return 'warn';
      default:
        return 'info';
    }
  }

  getInitials(user: User): string {
    const first = user.profile.firstName?.charAt(0) || '';
    const last = user.profile.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.username.charAt(0).toUpperCase();
  }
}

// Helper to map sort fields if needed, or just return as is
function getTypeSafeField(field: string): string {
  // Map frontend fields (camelCase) to backend fields (snake_case)
  const mapping: Record<string, string> = {
    firstName: 'first_name',
    lastName: 'last_name',
    fullName: 'full_name', // might not be sortable directly depending on backend
    email: 'email',
    username: 'username',
    createdAt: 'created_at',
  };
  return mapping[field] || field;
}
