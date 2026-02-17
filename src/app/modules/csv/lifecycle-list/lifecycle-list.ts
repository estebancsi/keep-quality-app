import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { LifecycleProjectsService } from '../services/lifecycle-projects.service';
import {
  LifecycleProject,
  LifecycleProjectStatus,
  LifecycleProjectType,
  LIFECYCLE_PROJECT_STATUS_OPTIONS,
  LIFECYCLE_PROJECT_TYPE_OPTIONS,
} from '../lifecycle-project.interface';
import { LifecycleFormDialog } from './lifecycle-form-dialog/lifecycle-form-dialog';
import { UsersService } from '@/modules/organization/users/users.service';

@Component({
  selector: 'app-lifecycle-list',
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
    SelectModule,
    MultiSelectModule,
    LifecycleFormDialog,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold m-0">Lifecycle Projects</h2>
          <p class="text-surface-500 mt-1 mb-0">
            Manage validation, periodic review, revalidation, and retirement phases
          </p>
        </div>
      </div>

      <!-- Toolbar -->
      <p-toolbar>
        <ng-template #start>
          <p-button
            label="New Project"
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
          <div class="flex items-center gap-3">
            <p-multiselect
              [options]="typeOptions"
              [(ngModel)]="selectedTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Type"
              [showClear]="true"
              [maxSelectedLabels]="1"
              selectedItemsLabel="{0} types"
              (onChange)="onFilterChange()"
              styleClass="w-48"
            />
            <p-multiselect
              [options]="statusOptions"
              [(ngModel)]="selectedStatuses"
              optionLabel="label"
              optionValue="value"
              placeholder="Filter by Status"
              [showClear]="true"
              [maxSelectedLabels]="1"
              selectedItemsLabel="{0} statuses"
              (onChange)="onFilterChange()"
              styleClass="w-48"
            />
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />
              <input
                pInputText
                type="text"
                placeholder="Search projects..."
                (input)="onGlobalFilter($event)"
              />
            </p-iconfield>
          </div>
        </ng-template>
      </p-toolbar>

      <!-- Table -->
      <p-table
        #dt
        [value]="projects()"
        [lazy]="true"
        (onLazyLoad)="loadProjects($event)"
        [paginator]="true"
        [rows]="25"
        [totalRecords]="totalRecords()"
        [loading]="loading()"
        [rowsPerPageOptions]="[10, 25, 50]"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
        [sortField]="'code'"
        [sortOrder]="-1"
        dataKey="id"
        styleClass="p-datatable-sm"
      >
        <ng-template #header>
          <tr>
            <th pSortableColumn="code" style="width: 80px">Code <p-sortIcon field="code" /></th>
            <th style="width: 220px">System</th>
            <th pSortableColumn="type" style="width: 150px">Type <p-sortIcon field="type" /></th>
            <th pSortableColumn="status" style="width: 140px">
              Status <p-sortIcon field="status" />
            </th>
            <th style="width: 160px">Owner</th>
            <th pSortableColumn="start_date" style="width: 120px">
              Start <p-sortIcon field="start_date" />
            </th>
            <th pSortableColumn="target_completion_date" style="width: 120px">
              Target <p-sortIcon field="target_completion_date" />
            </th>
            <th style="width: 100px">Actions</th>
          </tr>
        </ng-template>

        <ng-template #body let-project>
          <tr>
            <td class="font-mono font-semibold">{{ project.code }}</td>
            <td>
              @if (project.system) {
                <div class="flex flex-col">
                  <span class="font-semibold">{{ project.system.name }}</span>
                  <small class="text-surface-500">Code: {{ project.system.code }}</small>
                </div>
              } @else {
                <span class="text-surface-400">—</span>
              }
            </td>
            <td>
              <p-tag
                [value]="getTypeLabel(project.type)"
                [severity]="getTypeSeverity(project.type)"
              />
            </td>
            <td>
              <p-tag
                [value]="getStatusLabel(project.status)"
                [severity]="getStatusSeverity(project.status)"
              />
            </td>
            <td>{{ getOwnerName(project.assignedTo) }}</td>
            <td>{{ project.startDate ?? '—' }}</td>
            <td>{{ project.targetCompletionDate ?? '—' }}</td>
            <td>
              <div class="flex gap-1">
                <p-button
                  icon="pi pi-pencil"
                  [rounded]="true"
                  [text]="true"
                  severity="info"
                  (click)="openEditDialog(project)"
                  pTooltip="Edit"
                />
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  (click)="confirmDelete(project)"
                  pTooltip="Delete"
                />
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td [colSpan]="8" class="text-center py-8">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-folder-open text-4xl text-surface-400"></i>
                <span class="text-surface-500">No lifecycle projects found</span>
                <p-button
                  label="Create your first project"
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
    <app-lifecycle-form-dialog
      [visible]="dialogVisible()"
      [project]="selectedProject()"
      [systems]="systemOptions()"
      [users]="userOptions()"
      (visibleChange)="onDialogVisibleChange($event)"
      (saved)="onSaved($event)"
    />

    <!-- Confirm Dialog -->
    <p-confirmDialog />
  `,
})
export class LifecycleList {
  private readonly lifecycleService = inject(LifecycleProjectsService);
  private readonly usersService = inject(UsersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);

  private readonly dt = viewChild<Table>('dt');

  // State
  protected readonly projects = signal<LifecycleProject[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(true);
  protected readonly dialogVisible = signal(false);
  protected readonly selectedProject = signal<LifecycleProject | null>(null);
  protected readonly systemOptions = signal<{ id: string; name: string; code: number }[]>([]);
  protected readonly userOptions = signal<{ id: string; displayName: string }[]>([]);
  private globalFilter = '';
  private systemIdFilter: string | null = null;
  private lastEvent: TableLazyLoadEvent | null = null;

  // Filter state
  protected readonly typeOptions = LIFECYCLE_PROJECT_TYPE_OPTIONS;
  protected readonly statusOptions = LIFECYCLE_PROJECT_STATUS_OPTIONS;
  protected selectedTypes: LifecycleProjectType[] = [];
  protected selectedStatuses: LifecycleProjectStatus[] = [];

  // User cache for owner display
  private userMap = new Map<string, string>();

  // Load systems for picker + users on init
  private readonly initEffect = effect(() => {
    // Listen to query params for system filter
    this.route.queryParams.subscribe((params) => {
      this.systemIdFilter = params['systemId'] || null;
      if (this.lastEvent) {
        this.loadProjects(this.lastEvent);
      }
    });

    this.lifecycleService.loadSystemsForPicker().subscribe({
      next: (systems) => this.systemOptions.set(systems),
      error: () => this.systemOptions.set([]),
    });

    this.usersService
      .searchUsers({
        limit: 100,
        offset: 0,
        orderBy: 'created_at',
        ascending: true,
      })
      .subscribe({
        next: (res) => {
          const options = res.items.map((u) => ({
            id: u.idpUserId!,
            displayName: u.profile.fullName || u.email,
          }));
          this.userOptions.set(options);
          this.userMap.clear();
          for (const o of options) {
            this.userMap.set(o.id, o.displayName);
          }
        },
        error: () => this.userOptions.set([]),
      });
  });

  // ─── Table ───────────────────────────────────────────

  protected loadProjects(event: TableLazyLoadEvent): void {
    this.lastEvent = event;
    this.loading.set(true);

    this.lifecycleService
      .loadProjects({
        limit: event.rows ?? 25,
        offset: event.first ?? 0,
        sortField: (event.sortField as string) ?? 'code',
        sortOrder: event.sortOrder ?? -1,
        globalFilter: this.globalFilter || undefined,
        typeFilter: this.selectedTypes.length ? this.selectedTypes : undefined,
        statusFilter: this.selectedStatuses.length ? this.selectedStatuses : undefined,
        systemId: this.systemIdFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.projects.set(res.items);
          this.totalRecords.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.projects.set([]);
          this.loading.set(false);
        },
      });
  }

  protected refresh(): void {
    if (this.lastEvent) {
      this.loadProjects(this.lastEvent);
    }
  }

  protected onGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilter = value;
    if (this.lastEvent) {
      this.lastEvent.first = 0;
      this.loadProjects(this.lastEvent);
    }
  }

  protected onFilterChange(): void {
    if (this.lastEvent) {
      this.lastEvent.first = 0;
      this.loadProjects(this.lastEvent);
    }
  }

  protected onDialogVisibleChange(visible: boolean): void {
    this.dialogVisible.set(visible);
    if (!visible) {
      this.selectedProject.set(null);
    }
  }

  // ─── CRUD dialogs ───────────────────────────────────

  protected openCreateDialog(): void {
    if (this.systemIdFilter) {
      // Pre-fill system if filter is active
      this.selectedProject.set({ systemId: this.systemIdFilter } as any);
    } else {
      this.selectedProject.set(null);
    }
    this.dialogVisible.set(true);
  }

  protected openEditDialog(project: LifecycleProject): void {
    this.selectedProject.set(project);
    this.dialogVisible.set(true);
  }

  protected onSaved(payload: Partial<LifecycleProject>): void {
    const existing = this.selectedProject();

    if (existing) {
      // Check if status changed — use transition endpoint
      if (payload.status && payload.status !== existing.status) {
        this.lifecycleService.transitionStatus(existing, payload.status).subscribe({
          next: () => {
            // Now update remaining fields (without status)
            const { status, ...rest } = payload;
            if (Object.keys(rest).length > 0) {
              this.lifecycleService.updateProject(existing.id, rest).subscribe({
                next: () => {
                  this.dialogVisible.set(false);
                  this.refresh();
                },
              });
            } else {
              this.dialogVisible.set(false);
              this.refresh();
            }
          },
        });
      } else {
        this.lifecycleService.updateProject(existing.id, payload).subscribe({
          next: () => {
            this.dialogVisible.set(false);
            this.refresh();
          },
        });
      }
    } else {
      this.lifecycleService.createProject(payload).subscribe({
        next: () => {
          this.dialogVisible.set(false);
          this.refresh();
        },
      });
    }
  }

  protected confirmDelete(project: LifecycleProject): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete lifecycle project #${project.code}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.lifecycleService.deleteProject(project.id).subscribe({
          next: () => this.refresh(),
        });
      },
    });
  }

  // ─── Display helpers ────────────────────────────────

  protected getOwnerName(userId: string | null): string {
    if (!userId) return '—';
    return this.userMap.get(userId) ?? userId;
  }

  protected getTypeLabel(type: string): string {
    return LIFECYCLE_PROJECT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
  }

  protected getTypeSeverity(
    type: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      validation: 'info',
      periodic_review: 'success',
      revalidation: 'warn',
      retirement: 'danger',
    };
    return map[type] ?? 'secondary';
  }

  protected getStatusLabel(status: string): string {
    return LIFECYCLE_PROJECT_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  }

  protected getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      draft: 'secondary',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger',
    };
    return map[status] ?? 'secondary';
  }
}
