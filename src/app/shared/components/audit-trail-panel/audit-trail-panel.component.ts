import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { PanelModule } from 'primeng/panel';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuditTrailService } from '@/shared/services/audit-trail.service';
import { AuditEntry, AuditAction, FieldChange } from '@/shared/services/audit-trail.model';

/**
 * Reusable audit trail panel for displaying change history of any entity.
 *
 * Attach to any entity view by providing entityType, entityId, tenantId,
 * and the data source ('api' or 'supabase').
 *
 * @example
 * ```html
 * <app-audit-trail-panel
 *   entityType="User"
 *   entityId="user-123"
 *   tenantId="org-456"
 *   source="api"
 * />
 * ```
 */
@Component({
  selector: 'app-audit-trail-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    SlicePipe,
    TagModule,
    PanelModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ProgressSpinnerModule,
  ],
  template: `
    <p-panel header="Audit Trail" [toggleable]="true" [collapsed]="collapsed()">
      @if (loading()) {
        <div class="flex justify-center p-4">
          <p-progressSpinner ariaLabel="Loading audit trail" strokeWidth="4" styleClass="w-8 h-8" />
        </div>
      } @else if (entries().length === 0) {
        <div class="text-center text-muted-color p-4">
          <i class="pi pi-info-circle mr-2"></i>
          No audit trail entries found for this record.
        </div>
      } @else {
        <p-table
          [value]="entries()"
          [rows]="10"
          [paginator]="entries().length > 10"
          [rowsPerPageOptions]="[10, 25, 50]"
          styleClass="p-datatable-sm"
        >
          <ng-template #header>
            <tr>
              <th style="width: 180px">Timestamp</th>
              <th style="width: 100px">Action</th>
              <th>Changes</th>
              <th style="width: 180px">User</th>
              <th style="width: 200px">Reason</th>
            </tr>
          </ng-template>
          <ng-template #body let-entry>
            <tr>
              <td>{{ entry.created_at | date: 'medium' }}</td>
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
                      <li class="mb-1">
                        <span class="font-semibold">{{ change.field }}:</span>
                        @if (change.old_value !== null) {
                          <span class="text-red-400 line-through mr-1">{{ change.old_value }}</span>
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
    </p-panel>
  `,
})
export class AuditTrailPanelComponent {
  /** The type name of the entity (e.g., "User", "PlanTrabajo"). */
  readonly entityType = input.required<string>();

  /** The unique ID of the entity to display audit history for. */
  readonly entityId = input.required<string>();

  /** The tenant/organization ID for filtering. */
  readonly tenantId = input.required<string>();

  /** Data source: 'api' for IAM/Users, 'supabase' for application modules. */
  readonly source = input<'api' | 'supabase'>('supabase');

  /** Whether the panel starts collapsed. */
  readonly collapsed = input<boolean>(false);

  private readonly auditService = inject(AuditTrailService);

  readonly entries = signal<AuditEntry[]>([]);
  readonly loading = signal(false);
  readonly total = signal(0);

  constructor() {
    effect(() => {
      const entityType = this.entityType();
      const entityId = this.entityId();
      const tenantId = this.tenantId();
      const source = this.source();

      if (entityType && entityId && tenantId) {
        this.loadEntries(entityType, entityId, tenantId, source);
      }
    });
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

  private loadEntries(
    entityType: string,
    entityId: string,
    tenantId: string,
    source: 'api' | 'supabase',
  ): void {
    this.loading.set(true);

    const filters = {
      entity_type: entityType,
      entity_id: entityId,
      tenant_id: tenantId,
      limit: 100,
      offset: 0,
    };

    const observable =
      source === 'api'
        ? this.auditService.getApiEntityAuditTrail(filters)
        : this.auditService.getSupabaseAuditTrail(filters);

    observable.subscribe({
      next: (response) => {
        this.entries.set(response.items);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit trail:', err);
        this.entries.set([]);
        this.loading.set(false);
      },
    });
  }
}
