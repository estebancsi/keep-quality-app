import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EditorModule } from 'primeng/editor';
import { UrsService } from '../../services/urs.service';
import { UrsRequirement } from '../../urs.interface';

@Component({
  selector: 'app-urs-requirements-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    EditorModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <!-- Toolbar -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold m-0">User Requirements</h3>
        <div class="flex gap-2">
          <p-button
            label="Add Requirement"
            icon="pi pi-plus"
            size="small"
            (click)="addRequirement()"
            [loading]="adding()"
          />
        </div>
      </div>

      <!-- Table -->
      <p-table
        [value]="requirements()"
        (onRowReorder)="onRowReorder($event)"
        [loading]="loading()"
        dataKey="id"
        styleClass="p-datatable-sm"
      >
        <ng-template #header>
          <tr>
            <th style="width: 3rem" aria-label="Drag handle"></th>
            <th style="width: 5rem">Code</th>
            <th>Description</th>
            <th style="width: 6rem">Actions</th>
          </tr>
        </ng-template>

        <ng-template #body let-req let-index="rowIndex">
          <tr [pReorderableRow]="index">
            <td>
              <span class="pi pi-bars cursor-move" pReorderableRowHandle></span>
            </td>
            <td class="font-mono font-semibold">URS-{{ req.code }}</td>
            <td>
              @if (editingId() === req.id) {
                <p-editor [(ngModel)]="editDescription" [style]="{ height: '150px' }">
                  <ng-template #header>
                    <span class="ql-formats">
                      <button type="button" class="ql-bold" aria-label="Bold"></button>
                      <button type="button" class="ql-italic" aria-label="Italic"></button>
                      <button type="button" class="ql-underline" aria-label="Underline"></button>
                    </span>
                    <span class="ql-formats">
                      <button
                        type="button"
                        class="ql-list"
                        value="ordered"
                        aria-label="Ordered list"
                      ></button>
                      <button
                        type="button"
                        class="ql-list"
                        value="bullet"
                        aria-label="Bullet list"
                      ></button>
                    </span>
                  </ng-template>
                </p-editor>
                <div class="flex gap-2 mt-2">
                  <p-button
                    label="Save"
                    icon="pi pi-check"
                    size="small"
                    (click)="saveEdit(req)"
                    [loading]="saving()"
                  />
                  <p-button
                    label="Cancel"
                    icon="pi pi-times"
                    size="small"
                    severity="secondary"
                    [outlined]="true"
                    (click)="cancelEdit()"
                  />
                </div>
              } @else {
                <div
                  class="cursor-pointer min-h-8 p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  (click)="startEdit(req)"
                  (keydown.enter)="startEdit(req)"
                  tabindex="0"
                  role="button"
                  [attr.aria-label]="'Edit requirement URS-' + req.code"
                >
                  @if (req.description) {
                    <div [innerHTML]="req.description"></div>
                  } @else {
                    <span class="text-surface-400 italic">Click to add description…</span>
                  }
                </div>
              }
            </td>
            <td>
              <div class="flex gap-1">
                <p-button
                  icon="pi pi-pencil"
                  [rounded]="true"
                  [text]="true"
                  severity="info"
                  size="small"
                  (click)="startEdit(req)"
                  pTooltip="Edit"
                />
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  size="small"
                  (click)="confirmDelete(req)"
                  pTooltip="Delete"
                />
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td [colSpan]="4" class="text-center py-8">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-file-edit text-4xl text-surface-400"></i>
                <span class="text-surface-500">No requirements yet</span>
                <p-button
                  label="Add your first requirement"
                  [link]="true"
                  (click)="addRequirement()"
                />
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog />
  `,
})
export class UrsRequirementsTable {
  private readonly ursService = inject(UrsService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly lifecycleProjectId = input.required<string>();

  // State
  protected readonly requirements = signal<UrsRequirement[]>([]);
  protected readonly loading = signal(true);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected editDescription = '';

  private artifactId = '';

  // Load artifact + requirements when projectId changes
  private readonly loadEffect = effect(() => {
    const projectId = this.lifecycleProjectId();
    if (!projectId) return;

    this.loading.set(true);
    this.ursService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.artifactId = artifact.id;
        this.loadRequirements();
      },
      error: () => this.loading.set(false),
    });
  });

  private loadRequirements(): void {
    this.ursService.loadRequirements(this.artifactId).subscribe({
      next: (reqs) => {
        this.requirements.set(reqs);
        this.loading.set(false);
      },
      error: () => {
        this.requirements.set([]);
        this.loading.set(false);
      },
    });
  }

  protected addRequirement(): void {
    this.adding.set(true);
    const nextPosition = this.requirements().length;

    this.ursService.createRequirement(this.artifactId, nextPosition).subscribe({
      next: (req) => {
        this.requirements.update((prev) => [...prev, req]);
        this.adding.set(false);
        // Auto-open editor for the new requirement
        this.startEdit(req);
      },
      error: () => this.adding.set(false),
    });
  }

  protected startEdit(req: UrsRequirement): void {
    this.editingId.set(req.id);
    this.editDescription = req.description;
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editDescription = '';
  }

  protected saveEdit(req: UrsRequirement): void {
    this.saving.set(true);
    this.ursService.updateRequirement(req.id, { description: this.editDescription }).subscribe({
      next: (updated) => {
        this.requirements.update((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        this.editingId.set(null);
        this.editDescription = '';
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  protected onRowReorder(event: { dragIndex?: number; dropIndex?: number }): void {
    const dragIndex = event.dragIndex ?? 0;
    const dropIndex = event.dropIndex ?? 0;
    const reordered = [...this.requirements()];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const updates = reordered.map((req, index) => ({
      id: req.id,
      position: index,
    }));

    // Optimistically update local state
    this.requirements.set(reordered.map((req, index) => ({ ...req, position: index })));

    this.ursService.updatePositions(updates).subscribe({
      error: () => {
        // Revert on error
        this.loadRequirements();
      },
    });
  }

  protected confirmDelete(req: UrsRequirement): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete requirement URS-${req.code}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ursService.deleteRequirement(req.id).subscribe({
          next: () => {
            this.requirements.update((prev) => prev.filter((r) => r.id !== req.id));
          },
        });
      },
    });
  }
}
