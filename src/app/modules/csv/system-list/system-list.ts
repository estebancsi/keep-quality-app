import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableModule, Table, TableLazyLoadEvent, TableRowSelectEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ComputerizedSystemsService } from '../services/computerized-systems.service';
import {
  ComputerizedSystem,
  computeRiskLevel,
  CsvCategory,
  LIFECYCLE_STATUS_OPTIONS,
  VALIDATION_STATUS_OPTIONS,
} from '../computerized-systems.interface';
import { SystemFormDialog } from './system-form-dialog/system-form-dialog';

@Component({
  selector: 'app-system-list',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ToolbarModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    SystemFormDialog,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold m-0">Computerized Systems Inventory</h2>
          <p class="text-surface-500 mt-1 mb-0">GxP computerized systems validation management</p>
        </div>
      </div>

      <!-- Toolbar -->
      <p-toolbar>
        <ng-template #start>
          <p-button
            label="New System"
            icon="pi pi-plus"
            (click)="openCreateDialog()"
            class="mr-2"
          />
          <p-button
            icon="pi pi-refresh"
            severity="secondary"
            [outlined]="true"
            (click)="refresh()"
            pTooltip="Refresh"
          />
        </ng-template>
        <ng-template #end>
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              placeholder="Search systems..."
              (input)="onGlobalFilter($event)"
            />
          </p-iconfield>
        </ng-template>
      </p-toolbar>

      <!-- Table -->
      <p-table
        #dt
        [value]="systems()"
        [lazy]="true"
        (onLazyLoad)="loadSystems($event)"
        [paginator]="true"
        [rows]="25"
        [totalRecords]="totalRecords()"
        [loading]="loading()"
        [rowsPerPageOptions]="[10, 25, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} systems"
        [globalFilterFields]="['name', 'description', 'location']"
        [sortField]="'code'"
        [sortOrder]="1"
        dataKey="id"
        styleClass="p-datatable-sm"
        selectionMode="single"
        (onRowSelect)="onRowSelect($event)"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="code" style="width: 80px">Code <p-sortIcon field="code" /></th>
            <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
            <th style="width: 100px">Version</th>
            <th style="width: 180px">Category</th>
            <th pSortableColumn="location" style="width: 180px">
              Location <p-sortIcon field="location" />
            </th>
            <th style="width: 150px">Lifecycle</th>
            <th style="width: 170px">Validation</th>
            <th style="width: 100px">Risk</th>
            <th style="width: 80px">ALCOA+</th>
            <th style="width: 120px">Next Review</th>
            <th style="width: 100px">Actions</th>
          </tr>
        </ng-template>

        <ng-template #body let-system>
          <tr [pSelectableRow]="system">
            <td class="font-mono font-semibold">{{ system.code }}</td>
            <td>
              <div class="flex flex-col">
                <span class="font-semibold">{{ system.name }}</span>
                @if (system.description) {
                  <small class="text-surface-500 line-clamp-1">{{ system.description }}</small>
                }
              </div>
            </td>
            <td>{{ system.version ?? '—' }}</td>
            <td>
              @if (system.category) {
                <span class="text-sm"
                  >Cat. {{ system.category.code }} — {{ system.category.name }}</span
                >
              } @else {
                <span class="text-surface-400">—</span>
              }
            </td>
            <td>{{ system.location ?? '—' }}</td>
            <td>
              <p-tag
                [value]="getLifecycleLabel(system.lifecycleStatus)"
                [severity]="getLifecycleSeverity(system.lifecycleStatus)"
              />
            </td>
            <td>
              <p-tag
                [value]="getValidationLabel(system.validationStatus)"
                [severity]="getValidationSeverity(system.validationStatus)"
              />
            </td>
            <td>
              <p-tag [value]="getRiskLabel(system)" [severity]="getRiskSeverity(system)" />
            </td>
            <td class="text-center">
              @if (system.alcoaRelevant) {
                <i class="pi pi-check-circle text-green-500" pTooltip="ALCOA+ Relevant"></i>
              } @else {
                <i class="pi pi-minus-circle text-surface-400" pTooltip="Not ALCOA+ Relevant"></i>
              }
            </td>
            <td>{{ system.nextReviewDate ?? '—' }}</td>
            <td>
              <div class="flex gap-1" (click)="$event.stopPropagation()">
                <p-button
                  icon="pi pi-history"
                  [rounded]="true"
                  [text]="true"
                  severity="secondary"
                  (click)="openLifecycle(system)"
                  pTooltip="Manage Lifecycle Projects"
                />
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  (click)="confirmDelete(system)"
                  pTooltip="Delete"
                />
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td [colSpan]="11" class="text-center py-8">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-desktop text-4xl text-surface-400"></i>
                <span class="text-surface-500">No computerized systems found</span>
                <p-button
                  label="Add your first system"
                  [link]="true"
                  (click)="openCreateDialog()"
                />
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Form Dialog -->
    <app-system-form-dialog
      [visible]="dialogVisible()"
      [system]="selectedSystem()"
      [categories]="categories()"
      (visibleChange)="onDialogVisibleChange($event)"
      (saved)="onSaved($event)"
    />

    <!-- Confirm Dialog -->
    <p-confirmDialog />
  `,
})
export class SystemList {
  private readonly router = inject(Router);
  private readonly csvService = inject(ComputerizedSystemsService);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly dt = viewChild<Table>('dt');

  // State
  protected readonly systems = signal<ComputerizedSystem[]>([]);
  protected readonly categories = signal<CsvCategory[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(true);
  protected readonly dialogVisible = signal(false);
  protected readonly selectedSystem = signal<ComputerizedSystem | null>(null);
  private globalFilter = '';
  private lastEvent: TableLazyLoadEvent | null = null;

  // Load categories on init
  private readonly categoriesEffect = effect(() => {
    this.csvService.loadCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([]),
    });
  });

  // ─── Table ───────────────────────────────────────────

  protected onRowSelect(event: TableRowSelectEvent): void {
    this.openEditDialog(event.data as ComputerizedSystem);
  }

  protected loadSystems(event: TableLazyLoadEvent): void {
    this.lastEvent = event;
    this.loading.set(true);

    this.csvService
      .loadSystems({
        limit: event.rows ?? 25,
        offset: event.first ?? 0,
        sortField: (event.sortField as string) ?? 'code',
        sortOrder: event.sortOrder ?? 1,
        globalFilter: this.globalFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.systems.set(res.items);
          this.totalRecords.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.systems.set([]);
          this.loading.set(false);
        },
      });
  }

  protected refresh(): void {
    if (this.lastEvent) {
      this.loadSystems(this.lastEvent);
    }
  }

  protected onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilter = value;
    if (this.lastEvent) {
      this.lastEvent.first = 0;
      this.loadSystems(this.lastEvent);
    }
  }

  protected onDialogVisibleChange(visible: boolean): void {
    this.dialogVisible.set(visible);
    if (!visible) {
      // Clear selection when closing so next open (even for same system) triggers effect
      this.selectedSystem.set(null);
    }
  }

  // ─── CRUD dialogs ───────────────────────────────────

  protected openCreateDialog(): void {
    this.selectedSystem.set(null);
    this.dialogVisible.set(true);
  }

  protected openEditDialog(system: ComputerizedSystem): void {
    this.selectedSystem.set(system);
    this.dialogVisible.set(true);
  }

  protected onSaved(payload: Partial<ComputerizedSystem>): void {
    const existing = this.selectedSystem();

    if (existing) {
      // Update
      this.csvService.updateSystem(existing.id, payload).subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.refresh();
        },
      });
    } else {
      // Create
      this.csvService.createSystem(payload).subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.refresh();
        },
      });
    }
  }

  protected confirmDelete(system: ComputerizedSystem): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete system "${system.name}" (Code: ${system.code})?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.csvService.deleteSystem(system.id).subscribe({
          next: () => this.refresh(),
        });
      },
    });
  }

  // ─── Display helpers ────────────────────────────────

  protected openLifecycle(system: ComputerizedSystem): void {
    this.router.navigate(['/csv/lifecycle'], {
      queryParams: { systemId: system.id },
    });
  }

  protected getLifecycleLabel(status: string): string {
    return LIFECYCLE_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  }

  protected getLifecycleSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      draft: 'secondary',
      in_validation: 'info',
      operational: 'success',
      retired: 'warn',
      decommissioned: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  protected getValidationLabel(status: string): string {
    return VALIDATION_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  }

  protected getValidationSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      not_validated: 'secondary',
      validation_in_progress: 'info',
      validated: 'success',
      revalidation_required: 'warn',
    };
    return map[status] ?? 'secondary';
  }

  protected getRiskLabel(system: ComputerizedSystem): string {
    const level = computeRiskLevel(
      system.riskPatientSafety,
      system.riskProductQuality,
      system.riskDataIntegrity,
    );
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  protected getRiskSeverity(
    system: ComputerizedSystem,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const level = computeRiskLevel(
      system.riskPatientSafety,
      system.riskProductQuality,
      system.riskDataIntegrity,
    );
    if (level === 'high') return 'danger';
    if (level === 'medium') return 'warn';
    return 'success';
  }
}
