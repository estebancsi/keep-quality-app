import { Component, ChangeDetectionStrategy, input, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { CsvRolesListComponent } from '../components/csv-roles-list/csv-roles-list.component';
import { CsvPermissionsListComponent } from '../components/csv-permissions-list/csv-permissions-list.component';
import { CsvRolePermissionMatrixComponent } from '../components/csv-role-permission-matrix/csv-role-permission-matrix.component';
import { CsvRolePermissionTestingComponent } from '../components/csv-role-permission-testing/csv-role-permission-testing.component';
import { RolesPermissionsService } from '../../services/roles-permissions.service';
import { MessageService } from 'primeng/api';
import {
  CsvRole,
  CsvPermission,
  CsvRolePermissionMapping,
  CsvRolePermissionTestResult,
} from '../../roles-permissions.interface';
import { tap, catchError } from 'rxjs/operators';
import { EMPTY, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-csv-roles-permissions-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    MessageModule,
    CsvRolesListComponent,
    CsvPermissionsListComponent,
    CsvRolePermissionMatrixComponent,
    CsvRolePermissionTestingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="h-full flex flex-col bg-surface-0 dark:bg-surface-900 rounded shadow-sm border border-surface-200 dark:border-surface-700 p-4"
    >
      <div class="mb-4">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0 m-0">
          Roles & Permissions Testing
        </h2>
        <p class="text-surface-600 dark:text-surface-400 mt-2">
          Configure project roles, define permissions, map them in the matrix, and execute
          exception-based tests to securely log evidence of correct configurations.
        </p>
      </div>

      @if (initialLoading()) {
        <div class="flex-1 flex justify-center items-center">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-500"></i>
        </div>
      } @else {
        <p-tabs value="roles" class="w-full flex-1 flex flex-col">
          <p-tablist>
            <p-tab value="roles">Roles Configure</p-tab>
            <p-tab value="permissions">Permissions Configure</p-tab>
            <p-tab value="mapping">Mapping Matrix</p-tab>
            <p-tab value="testing">Test Execution</p-tab>
          </p-tablist>

          <p-tabpanels>
            <p-tabpanel value="roles">
              <app-csv-roles-list
                [projectId]="projectId()"
                [roles]="roles()"
                [loading]="rolesLoading()"
                (roleAdded)="onAddRole($event)"
                (roleUpdated)="onUpdateRole($event)"
                (roleDeleted)="onDeleteRole($event)"
              />
            </p-tabpanel>

            <p-tabpanel value="permissions">
              <app-csv-permissions-list
                [projectId]="projectId()"
                [permissions]="permissions()"
                [loading]="permissionsLoading()"
                (permissionAdded)="onAddPermission($event)"
                (permissionUpdated)="onUpdatePermission($event)"
                (permissionDeleted)="onDeletePermission($event)"
              />
            </p-tabpanel>

            <p-tabpanel value="mapping">
              <app-csv-role-permission-matrix
                [projectId]="projectId()"
                [roles]="roles()"
                [permissions]="permissions()"
                [mappings]="mappings()"
                (mappingUpdated)="onUpdateMapping($event)"
              />
            </p-tabpanel>

            <p-tabpanel value="testing">
              <app-csv-role-permission-testing
                [projectId]="projectId()"
                [roles]="roles()"
                [permissions]="permissions()"
                [mappings]="mappings()"
                [testResults]="testResults()"
                [loading]="loadingResults()"
                [savingResult]="savingResult()"
                (saveResult)="onSaveTestResult($event)"
              />
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      }
    </div>
  `,
})
export class CsvRolesPermissionsWrapperComponent {
  readonly projectId = input.required<string>();

  private service = inject(RolesPermissionsService);
  private messageService = inject(MessageService);

  readonly roles = signal<CsvRole[]>([]);
  readonly permissions = signal<CsvPermission[]>([]);
  readonly mappings = signal<CsvRolePermissionMapping[]>([]);
  readonly testResults = signal<CsvRolePermissionTestResult[]>([]);

  readonly initialLoading = signal(true);
  readonly rolesLoading = signal(false);
  readonly permissionsLoading = signal(false);
  readonly loadingResults = signal(false);
  readonly savingResult = signal(false);

  constructor() {
    effect(() => {
      const pid = this.projectId();
      if (pid) {
        this.loadAllData(pid);
      }
    });
  }

  private loadAllData(projectId: string) {
    this.initialLoading.set(true);

    // Subscribing to observables from service directly for live updates
    this.service
      .getRolesByProjectId(projectId)
      .pipe(
        tap((data) => this.roles.set(data)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading roles.',
          });
          console.error(err);
          return EMPTY;
        }),
      )
      .subscribe();

    this.service
      .getPermissionsByProjectId(projectId)
      .pipe(
        tap((data) => this.permissions.set(data)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading permissions.',
          });
          console.error(err);
          return EMPTY;
        }),
      )
      .subscribe();

    this.service
      .getMappingsByProjectId(projectId)
      .pipe(
        tap((data) => this.mappings.set(data)),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading mappings.',
          });
          console.error(err);
          return EMPTY;
        }),
      )
      .subscribe();

    this.service
      .getTestResultsByProjectId(projectId)
      .pipe(
        tap((data) => {
          this.testResults.set(data);
          this.initialLoading.set(false);
        }),
        catchError((err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error loading test results.',
          });
          console.error(err);
          this.initialLoading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  // --- Roles Handlers ---
  async onAddRole(role: Partial<CsvRole>) {
    this.rolesLoading.set(true);
    try {
      const newRole = await firstValueFrom(this.service.addRole(role));
      this.roles.update((r) => [...r, newRole]);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Role added successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add role',
      });
    } finally {
      this.rolesLoading.set(false);
    }
  }

  async onUpdateRole(event: { id: string; data: Partial<CsvRole> }) {
    this.rolesLoading.set(true);
    try {
      const updatedRole = await firstValueFrom(this.service.updateRole(event.id, event.data));
      this.roles.update((r) => r.map((role) => (role.id === event.id ? updatedRole : role)));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Role updated successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update role',
      });
    } finally {
      this.rolesLoading.set(false);
    }
  }

  async onDeleteRole(id: string) {
    this.rolesLoading.set(true);
    try {
      await firstValueFrom(this.service.deleteRole(id));
      this.roles.update((r) => r.filter((role) => role.id !== id));
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Role deleted' });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete role',
      });
    } finally {
      this.rolesLoading.set(false);
    }
  }

  // --- Permissions Handlers ---
  async onAddPermission(permission: Partial<CsvPermission>) {
    this.permissionsLoading.set(true);
    try {
      const newPerm = await firstValueFrom(this.service.addPermission(permission));
      this.permissions.update((p) => [...p, newPerm]);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission added',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to add permission',
      });
    } finally {
      this.permissionsLoading.set(false);
    }
  }

  async onUpdatePermission(event: { id: string; data: Partial<CsvPermission> }) {
    this.permissionsLoading.set(true);
    try {
      const updatedPerm = await firstValueFrom(this.service.updatePermission(event.id, event.data));
      this.permissions.update((p) => p.map((perm) => (perm.id === event.id ? updatedPerm : perm)));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission updated successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update permission',
      });
    } finally {
      this.permissionsLoading.set(false);
    }
  }

  async onDeletePermission(id: string) {
    this.permissionsLoading.set(true);
    try {
      await firstValueFrom(this.service.deletePermission(id));
      this.permissions.update((p) => p.filter((perm) => perm.id !== id));
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Permission deleted',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete permission',
      });
    } finally {
      this.permissionsLoading.set(false);
    }
  }

  // --- Matrix Mapping Handlers ---
  async onUpdateMapping(event: {
    roleId: string;
    permissionId: string;
    expectedAccess: 'Granted' | 'Restricted' | 'N/A';
  }) {
    try {
      const existingMapping = this.mappings().find(
        (m) => m.roleId === event.roleId && m.permissionId === event.permissionId,
      );

      if (existingMapping) {
        const updated = await firstValueFrom(
          this.service.saveMapping({
            ...existingMapping,
            expectedAccess: event.expectedAccess,
          }),
        );
        this.mappings.update((m) =>
          m.map((mapping) => (mapping.id === updated.id ? updated : mapping)),
        );
      } else {
        const added = await firstValueFrom(
          this.service.saveMapping({
            lifecycleProjectId: this.projectId(),
            roleId: event.roleId,
            permissionId: event.permissionId,
            expectedAccess: event.expectedAccess,
          }),
        );
        this.mappings.update((m) => [...m, added]);
      }
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update mapping access rule',
      });
    }
  }

  // --- Test Results Handlers ---
  async onSaveTestResult(event: {
    mappingId: string;
    actualResult: string;
    attachmentUrls: any[];
    status: 'Pass' | 'Fail' | 'Pending';
  }) {
    this.savingResult.set(true);
    try {
      const existingTest = this.testResults().find((tr) => tr.mappingId === event.mappingId);
      if (existingTest) {
        const updated = await firstValueFrom(
          this.service.saveTestResult({
            ...existingTest,
            actualResult: event.actualResult,
            status: event.status,
            attachmentUrls: event.attachmentUrls,
          }),
        );
        this.testResults.update((tr) => tr.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const added = await firstValueFrom(
          this.service.saveTestResult({
            lifecycleProjectId: this.projectId(),
            mappingId: event.mappingId,
            actualResult: event.actualResult,
            status: event.status,
            attachmentUrls: event.attachmentUrls,
          }),
        );
        this.testResults.update((tr) => [...tr, added]);
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Test execution logged successfully',
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save test result',
      });
    } finally {
      this.savingResult.set(false);
    }
  }
}
