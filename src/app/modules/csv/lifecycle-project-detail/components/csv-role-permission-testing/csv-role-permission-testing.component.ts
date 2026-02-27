import { Component, ChangeDetectionStrategy, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import {
  CsvRolePermissionMapping,
  CsvRolePermissionTestResult,
  CsvRole,
  CsvPermission,
} from '../../../roles-permissions.interface';
import { CsvRolePermissionTestDrawerComponent } from '../csv-role-permission-test-drawer/csv-role-permission-test-drawer.component';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';

@Component({
  selector: 'app-csv-role-permission-testing',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    FormsModule,
    CsvRolePermissionTestDrawerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4">
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">
        Testing & Execution
      </h3>
      <p class="text-surface-600 dark:text-surface-400 mt-1">
        Execute test exceptions for the expected Role/Permission access rules.
      </p>
    </div>

    @if (mappings().length === 0) {
      <div
        class="text-center p-6 border border-dashed border-surface-300 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-900"
      >
        <p class="text-surface-600 dark:text-surface-400 m-0">
          No mappings configured. Please define Roles, Permissions, and set up the Matrix first.
        </p>
      </div>
    } @else {
      <p-table
        #dt
        [value]="mappedRows()"
        [loading]="loading()"
        [paginator]="true"
        [rows]="10"
        [globalFilterFields]="['roleName', 'permissionName', 'expectedAccess', 'status']"
        styleClass="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <ng-template pTemplate="caption">
          <div class="flex justify-end">
            <p-iconfield>
              <p-inputicon class="pi pi-search" />
              <input
                pInputText
                #filterInput
                type="text"
                (input)="dt.filterGlobal(filterInput.value, 'contains')"
                placeholder="Search tests..."
                class="p-inputtext-sm"
              />
            </p-iconfield>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="roleName">Role <p-sortIcon field="roleName"></p-sortIcon></th>
            <th pSortableColumn="permissionName">
              Permission <p-sortIcon field="permissionName"></p-sortIcon>
            </th>
            <th pSortableColumn="expectedAccess">
              Expected <p-sortIcon field="expectedAccess"></p-sortIcon>
            </th>
            <th pSortableColumn="status" class="w-[120px] text-center">
              Status <p-sortIcon field="status"></p-sortIcon>
            </th>
            <th class="w-[100px] text-center">Test</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-row>
          <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
            <td class="font-medium">{{ row.roleName }}</td>
            <td>{{ row.permissionName }}</td>
            <td>
              <span
                class="px-2 py-1 rounded text-xs font-medium"
                [ngClass]="{
                  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400':
                    row.expectedAccess === 'Granted',
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400':
                    row.expectedAccess === 'Restricted',
                  'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-400':
                    row.expectedAccess === 'N/A',
                }"
                >{{ row.expectedAccess }}</span
              >
            </td>
            <td class="text-center font-medium" [ngClass]="getStatusColor(row.status)">
              {{ row.status || 'Pending' }}
            </td>
            <td class="text-center">
              <p-button
                icon="pi pi-play"
                [text]="true"
                [rounded]="true"
                severity="info"
                size="small"
                pTooltip="Execute / View Evidence"
                tooltipPosition="left"
                (click)="openTestDrawer(row)"
              />
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="empty">
          <tr>
            <td colspan="5" class="text-center text-surface-500 p-4">No matching tests found.</td>
          </tr>
        </ng-template>
      </p-table>
    }

    <!-- Side Drawer for Testing specific Mapping -->
    <app-csv-role-permission-test-drawer
      [(visible)]="drawerVisible"
      [mapping]="selectedMapping()"
      [role]="selectedRole()"
      [permission]="selectedPermission()"
      [testResult]="selectedTestResult()"
      [saving]="savingResult()"
      (save)="onSaveResult($event)"
    />
  `,
})
export class CsvRolePermissionTestingComponent {
  readonly projectId = input.required<string>();
  readonly roles = input.required<CsvRole[]>();
  readonly permissions = input.required<CsvPermission[]>();
  readonly mappings = input.required<CsvRolePermissionMapping[]>();
  readonly testResults = input.required<CsvRolePermissionTestResult[]>();
  readonly loading = input<boolean>(false);
  readonly savingResult = input<boolean>(false);

  readonly saveResult = output<{
    mappingId: string;
    actualResult: string;
    attachmentUrls: AttachmentCache[];
    status: 'Pass' | 'Fail' | 'Pending';
  }>();

  readonly drawerVisible = signal(false);
  readonly selectedMapping = signal<CsvRolePermissionMapping | null>(null);
  readonly selectedRole = signal<CsvRole | null>(null);
  readonly selectedPermission = signal<CsvPermission | null>(null);

  // Derive selected test result dynamically so it updates when a save completes and testResults is updated
  readonly selectedTestResult = computed(() => {
    const mapping = this.selectedMapping();
    if (!mapping) return null;
    return this.testResults().find((tr) => tr.mappingId === mapping.id) || null;
  });

  // Derive mapped rows for the table
  readonly mappedRows = computed(() => {
    const rolesMap = new Map(this.roles().map((r) => [r.id, r]));
    const permissionsMap = new Map(this.permissions().map((p) => [p.id, p]));
    const resultsMap = new Map(this.testResults().map((tr) => [tr.mappingId, tr]));

    return this.mappings().map((mapping) => {
      const role = rolesMap.get(mapping.roleId);
      const permission = permissionsMap.get(mapping.permissionId);
      const testResult = resultsMap.get(mapping.id);

      return {
        mapping,
        roleName: role?.name || 'Unknown Role',
        permissionName: permission?.name || 'Unknown Permission',
        expectedAccess: mapping.expectedAccess,
        status: testResult?.status || 'Pending',
        testResult,
        role,
        permission,
      };
    });
  });

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pass':
        return 'text-green-600 dark:text-green-400';
      case 'Fail':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-surface-500';
    }
  }

  openTestDrawer(row: {
    role?: CsvRole;
    permission?: CsvPermission;
    mapping: CsvRolePermissionMapping;
    testResult?: CsvRolePermissionTestResult;
  }) {
    if (!row.role || !row.permission) return;

    this.selectedMapping.set(row.mapping);
    this.selectedRole.set(row.role);
    this.selectedPermission.set(row.permission);

    this.drawerVisible.set(true);
  }

  onSaveResult(event: {
    mappingId: string;
    actualResult: string;
    attachmentUrls: AttachmentCache[];
    status: 'Pass' | 'Fail' | 'Pending';
  }) {
    this.saveResult.emit(event);

    // The parent component should handle updating the state, which will automatically
    // update the ui through inputs if successful. We don't close the drawer here automatically
    // to allow the user to see the success/error loading state, we leave it to parent to flip drawerVisible or let user close it
  }
}
