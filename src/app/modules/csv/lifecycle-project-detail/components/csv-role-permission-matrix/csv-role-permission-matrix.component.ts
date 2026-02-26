import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import {
  CsvRole,
  CsvPermission,
  CsvRolePermissionMapping,
} from '../../../roles-permissions.interface';

@Component({
  selector: 'app-csv-role-permission-matrix',
  standalone: true,
  imports: [CommonModule, TableModule, SelectModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4">
      <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 m-0">
        Role & Permission Matrix
      </h3>
      <p class="text-surface-600 dark:text-surface-400 mt-1">
        Configure the expected access level for each role/permission combination.
      </p>
    </div>

    @if (roles().length === 0 || permissions().length === 0) {
      <div
        class="text-center p-6 border border-dashed border-surface-300 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-900"
      >
        <p class="text-surface-600 dark:text-surface-400 m-0">
          You must define at least one Role and one Permission to configure the matrix.
        </p>
      </div>
    } @else {
      <div class="overflow-x-auto">
        <table
          class="w-full text-sm text-left border-collapse border border-surface-200 dark:border-surface-700"
        >
          <thead class="bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300">
            <tr>
              <th
                class="p-3 border border-surface-200 dark:border-surface-700 font-semibold min-w-[200px] sticky left-0 bg-surface-50 dark:bg-surface-800 z-10 w-1/4"
              >
                Permission \\ Role
              </th>
              @for (role of roles(); track role.id) {
                <th
                  class="p-3 border border-surface-200 dark:border-surface-700 font-semibold min-w-[150px] text-center"
                >
                  {{ role.name }}
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (permission of permissions(); track permission.id) {
              <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <td
                  class="p-3 border border-surface-200 dark:border-surface-700 font-medium sticky left-0 bg-white dark:bg-surface-900 z-10"
                >
                  {{ permission.name }}
                </td>
                @for (role of roles(); track role.id) {
                  <td class="p-2 border border-surface-200 dark:border-surface-700 text-center">
                    <p-select
                      [options]="accessOptions"
                      [ngModel]="getExpectedAccess(role.id, permission.id)"
                      (ngModelChange)="onAccessChange(role.id, permission.id, $event)"
                      styleClass="w-full text-sm border-none shadow-none"
                      appendTo="body"
                      placeholder="N/A"
                    >
                      <ng-template #selectedItem let-option>
                        <div class="flex items-center gap-2">
                          <span
                            class="w-2 h-2 rounded-full"
                            class="rounded-full"
                            [style.background-color]="
                              option === 'Granted'
                                ? 'var(--green-500)'
                                : option === 'Restricted'
                                  ? 'var(--red-500)'
                                  : 'var(--surface-300)'
                            "
                          ></span>
                          <span class="text-xs">{{ option || 'N/A' }}</span>
                        </div>
                      </ng-template>
                      <ng-template #item let-option>
                        <div class="flex items-center gap-2">
                          <span
                            class="w-2 h-2 rounded-full"
                            [style.background-color]="
                              option === 'Granted'
                                ? 'var(--green-500)'
                                : option === 'Restricted'
                                  ? 'var(--red-500)'
                                  : 'var(--surface-300)'
                            "
                          ></span>
                          <span class="text-sm">{{ option || 'N/A' }}</span>
                        </div>
                      </ng-template>
                    </p-select>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class CsvRolePermissionMatrixComponent {
  readonly projectId = input.required<string>();
  readonly roles = input.required<CsvRole[]>();
  readonly permissions = input.required<CsvPermission[]>();
  readonly mappings = input.required<CsvRolePermissionMapping[]>();

  readonly mappingUpdated = output<{
    roleId: string;
    permissionId: string;
    expectedAccess: 'Granted' | 'Restricted' | 'N/A';
  }>();

  readonly accessOptions = ['Granted', 'Restricted', 'N/A'];

  // Create a computed map for O(1) lookups: mappingMap[roleId_permissionId] = mapping
  private mappingsMap = computed(() => {
    const map = new Map<string, CsvRolePermissionMapping>();
    for (const mapping of this.mappings()) {
      map.set(`${mapping.roleId}_${mapping.permissionId}`, mapping);
    }
    return map;
  });

  getExpectedAccess(roleId: string, permissionId: string): 'Granted' | 'Restricted' | 'N/A' {
    const mapping = this.mappingsMap().get(`${roleId}_${permissionId}`);
    return mapping?.expectedAccess || 'N/A';
  }

  onAccessChange(
    roleId: string,
    permissionId: string,
    expectedAccess: 'Granted' | 'Restricted' | 'N/A',
  ) {
    if (!expectedAccess) expectedAccess = 'N/A';
    this.mappingUpdated.emit({ roleId, permissionId, expectedAccess });
  }
}
