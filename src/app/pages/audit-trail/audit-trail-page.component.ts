import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { DatePipe, NgTemplateOutlet, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';

import { AuditTrailService } from '@/shared/services/audit-trail.service';
import { OrganizationService } from '@/auth/organization.service';
import { AuditEntry, AuditAction, AuditSearchFilters } from '@/shared/services/audit-trail.model';

interface ActionOption {
  label: string;
  value: AuditAction | '';
}

/**
 * Full-page audit trail view with two tabs:
 * - Application: queries Supabase audit_trail table.
 * - IAM / Users: queries the API backend.
 */
@Component({
  selector: 'app-audit-trail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    SlicePipe,
    NgTemplateOutlet,
    FormsModule,
    TabsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    TooltipModule,
    ProgressSpinnerModule,
    CardModule,
  ],
  template: `
    <div class="p-4">
      <h2 class="mt-0 mb-4">
        <i class="pi pi-shield mr-2"></i>
        Audit Trail
      </h2>

      <p-card>
        <!-- Filter bar -->
        <div class="flex flex-wrap gap-3 mb-4 items-end">
          <div class="flex flex-col gap-1">
            <label for="entityType" class="text-sm font-semibold">Entity Type</label>
            <input
              id="entityType"
              pInputText
              [(ngModel)]="filterEntityType"
              placeholder="e.g. User"
              class="w-40"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="action" class="text-sm font-semibold">Action</label>
            <p-select
              id="action"
              [(ngModel)]="filterAction"
              [options]="actionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All"
              class="w-36"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="dateFrom" class="text-sm font-semibold">From</label>
            <p-datepicker
              id="dateFrom"
              [(ngModel)]="filterDateFrom"
              [showTime]="false"
              dateFormat="yy-mm-dd"
              placeholder="Start date"
              class="w-40"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="dateTo" class="text-sm font-semibold">To</label>
            <p-datepicker
              id="dateTo"
              [(ngModel)]="filterDateTo"
              [showTime]="false"
              dateFormat="yy-mm-dd"
              placeholder="End date"
              class="w-40"
            />
          </div>

          <p-button label="Search" icon="pi pi-search" (onClick)="search(activeTabIndex())" />

          <p-button
            label="Clear"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            (onClick)="clearFilters()"
          />
        </div>

        <!-- Tabs -->
        <p-tabs [value]="activeTabIndex()" (valueChange)="onTabChange($event)">
          <p-tablist>
            <p-tab [value]="0">
              <i class="pi pi-box mr-2"></i>
              Application
            </p-tab>
            <p-tab [value]="1">
              <i class="pi pi-users mr-2"></i>
              IAM / Users
            </p-tab>
          </p-tablist>

          <p-tabpanels>
            <!-- Application tab (Supabase) -->
            <p-tabpanel [value]="0">
              <ng-container
                *ngTemplateOutlet="
                  auditTable;
                  context: { $implicit: supabaseEntries(), loading: supabaseLoading() }
                "
              />
            </p-tabpanel>

            <!-- IAM/Users tab (API) -->
            <p-tabpanel [value]="1">
              <ng-container
                *ngTemplateOutlet="
                  auditTable;
                  context: { $implicit: apiEntries(), loading: apiLoading() }
                "
              />
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </p-card>

      <!-- Shared table template -->
      <ng-template #auditTable let-entries let-loading="loading">
        @if (loading) {
          <div class="flex justify-center p-6">
            <p-progressSpinner
              ariaLabel="Loading audit trail"
              strokeWidth="4"
              styleClass="w-10 h-10"
            />
          </div>
        } @else if (entries.length === 0) {
          <div class="text-center text-muted-color p-6">
            <i class="pi pi-info-circle text-2xl mb-2 block"></i>
            <p>No audit trail entries found.</p>
          </div>
        } @else {
          <p-table
            [value]="entries"
            [rows]="20"
            [paginator]="true"
            [rowsPerPageOptions]="[10, 20, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
            styleClass="p-datatable-sm p-datatable-striped"
            [tableStyle]="{ 'min-width': '60rem' }"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="created_at" style="width: 180px">
                  Timestamp <p-sortIcon field="created_at" />
                </th>
                <th style="width: 120px">Entity Type</th>
                <th style="width: 120px">Entity ID</th>
                <th style="width: 110px">Action</th>
                <th>Changes</th>
                <th style="width: 150px">User</th>
                <th style="width: 180px">Reason</th>
              </tr>
            </ng-template>
            <ng-template #body let-entry>
              <tr>
                <td>{{ entry.created_at | date: 'medium' }}</td>
                <td>
                  <span class="font-semibold text-sm">{{ entry.entity_type }}</span>
                </td>
                <td>
                  <span
                    class="text-sm font-mono"
                    [pTooltip]="entry.entity_id"
                    tooltipPosition="top"
                  >
                    {{ entry.entity_id | slice: 0 : 10 }}…
                  </span>
                </td>
                <td>
                  <p-tag
                    [value]="entry.action_label || entry.action"
                    [severity]="getActionSeverity(entry.action)"
                  />
                </td>
                <td>
                  @if (entry.changes && entry.changes.length > 0) {
                    <ul class="list-none m-0 p-0">
                      @for (change of entry.changes; track change.field) {
                        <li class="mb-1 text-sm">
                          <span class="font-semibold">{{ change.field }}:</span>
                          @if (change.old_value !== null) {
                            <span class="text-red-400 line-through mr-1">{{
                              change.old_value
                            }}</span>
                          }
                          @if (change.new_value !== null) {
                            <span class="text-green-400">{{ change.new_value }}</span>
                          }
                        </li>
                      }
                    </ul>
                  } @else {
                    <span class="text-muted-color">—</span>
                  }
                </td>
                <td>
                  <span class="text-sm" [pTooltip]="entry.user_id" tooltipPosition="top">
                    {{ entry.user_id | slice: 0 : 12 }}…
                  </span>
                </td>
                <td>
                  @if (entry.reason) {
                    <span class="text-sm">{{ entry.reason }}</span>
                  } @else {
                    <span class="text-muted-color">—</span>
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </ng-template>
    </div>
  `,
})
export class AuditTrailPageComponent implements OnInit {
  private readonly auditService = inject(AuditTrailService);
  private readonly orgService = inject(OrganizationService);

  // Filter state
  filterEntityType = '';
  filterAction = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;

  // Tab state
  readonly activeTabIndex = signal(0);

  // Data state
  readonly apiEntries = signal<AuditEntry[]>([]);
  readonly apiLoading = signal(false);
  readonly supabaseEntries = signal<AuditEntry[]>([]);
  readonly supabaseLoading = signal(false);

  readonly actionOptions: ActionOption[] = [
    { label: 'All', value: '' },
    { label: 'Create', value: 'CREATE' },
    { label: 'Update', value: 'UPDATE' },
    { label: 'Delete', value: 'DELETE' },
    { label: 'Action', value: 'ACTION' },
  ];

  ngOnInit(): void {
    this.search(0);
  }

  onTabChange(index: string | number | undefined): void {
    const tabIndex = Number(index ?? 0);
    this.activeTabIndex.set(tabIndex);
    this.search(tabIndex);
  }

  search(tabIndex: number): void {
    const filters = this.buildFilters();

    if (tabIndex === 0) {
      this.loadSupabase(filters);
    } else {
      this.loadApi(filters);
    }
  }

  clearFilters(): void {
    this.filterEntityType = '';
    this.filterAction = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.search(this.activeTabIndex());
  }

  getActionSeverity(action: AuditAction): 'success' | 'info' | 'danger' | 'warn' | 'secondary' {
    const severityMap: Record<AuditAction, 'success' | 'info' | 'danger' | 'warn' | 'secondary'> = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'danger',
      ACTION: 'warn',
    };
    return severityMap[action] ?? 'secondary';
  }

  private buildFilters(): AuditSearchFilters {
    const tenantId = this.orgService.activeOrganizationId() ?? '';

    const filters: AuditSearchFilters = {
      tenant_id: tenantId,
      limit: 100,
      offset: 0,
    };

    if (this.filterEntityType) {
      filters.entity_type = this.filterEntityType;
    }
    if (this.filterAction) {
      filters.action = this.filterAction as AuditAction;
    }
    if (this.filterDateFrom) {
      filters.date_from = this.filterDateFrom.toISOString();
    }
    if (this.filterDateTo) {
      filters.date_to = this.filterDateTo.toISOString();
    }

    return filters;
  }

  private loadApi(filters: AuditSearchFilters): void {
    this.apiLoading.set(true);
    this.auditService.getApiAuditTrail(filters).subscribe({
      next: (res) => {
        this.apiEntries.set(res.items);
        this.apiLoading.set(false);
      },
      error: (err) => {
        console.error('API audit trail error:', err);
        this.apiEntries.set([]);
        this.apiLoading.set(false);
      },
    });
  }

  private loadSupabase(filters: AuditSearchFilters): void {
    this.supabaseLoading.set(true);
    this.auditService.getSupabaseAuditTrail(filters).subscribe({
      next: (res) => {
        this.supabaseEntries.set(res.items);
        this.supabaseLoading.set(false);
      },
      error: (err) => {
        console.error('Supabase audit trail error:', err);
        this.supabaseEntries.set([]);
        this.supabaseLoading.set(false);
      },
    });
  }
}
