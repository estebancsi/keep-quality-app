import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { EditorModule } from 'primeng/editor';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FsCsService } from '../../services/fs-cs.service';
import { FsCsRequirement, FsCsRequirementType } from '../../fs-cs.interface';
import { UrsService } from '../../services/urs.service';
import { UrsRequirement } from '../../urs.interface';

@Component({
  selector: 'app-fs-cs-requirements-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    EditorModule,
    MultiSelectModule,
    InputTextModule,
    AutoCompleteModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <!-- Toolbar -->
      <div class="flex items-center justify-between">
        <h4 class="text-base font-semibold m-0">{{ title() }}</h4>
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
        rowGroupMode="subheader"
        groupRowsBy="groupName"
        sortField="position"
        sortMode="single"
      >
        <ng-template #header>
          <tr>
            <th style="width: 3rem" aria-label="Drag handle"></th>
            <th style="width: 6rem">Code</th>
            <th style="width: 10rem">Group</th>
            <th>Description & Traceability</th>
            <th style="width: 6rem">Actions</th>
          </tr>
        </ng-template>

        <ng-template #groupheader let-req let-expanded="expanded">
          <tr pRowGroupHeader>
            <td colspan="5">
              <button
                type="button"
                pButton
                pRipple
                [pRowToggler]="req"
                text
                rounded
                plain
                class="mr-2"
                [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
              >
                {{ req.groupName || 'Uncategorized' }}
              </button>
            </td>
          </tr>
        </ng-template>

        <ng-template #expandedrow let-req let-index="rowIndex">
          <tr [pReorderableRow]="index">
            <td class="align-top">
              <span class="pi pi-bars cursor-move mt-2" pReorderableRowHandle></span>
            </td>
            <td class="align-top font-mono font-semibold pt-3">
              {{ getCodePrefix() }}-{{ req.code }}
            </td>

            <td class="align-top pt-2">
              @if (editingId() === req.id) {
                <p-autoComplete
                  [(ngModel)]="editGroupName"
                  [suggestions]="groupSuggestions()"
                  (completeMethod)="searchGroups($event)"
                  [dropdown]="true"
                  placeholder="Group Name"
                  appendTo="body"
                  [style]="{ width: '100%' }"
                />
              } @else {
                <span class="text-sm">{{ req.groupName || '-' }}</span>
              }
            </td>

            <td class="align-top">
              @if (editingId() === req.id) {
                <div class="flex flex-col gap-2">
                  <p-editor [(ngModel)]="editDescription" [style]="{ height: '120px' }">
                    <ng-template #header>
                      <span class="ql-formats">
                        <button type="button" class="ql-bold" aria-label="Bold"></button>
                        <button type="button" class="ql-italic" aria-label="Italic"></button>
                        <button
                          type="button"
                          class="ql-list"
                          value="bullet"
                          aria-label="Bullet List"
                        ></button>
                      </span>
                    </ng-template>
                  </p-editor>

                  <div class="flex flex-col gap-1">
                    <label class="text-xs font-semibold text-surface-500" for="trace-urs"
                      >Trace to URS</label
                    >
                    <p-multiSelect
                      inputId="trace-urs"
                      [options]="ursOptions()"
                      [(ngModel)]="editTraceUrsIds"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select URS Requirements"
                      [style]="{ width: '100%' }"
                      appendTo="body"
                    />
                  </div>

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
                </div>
              } @else {
                <div
                  class="cursor-pointer min-h-8 p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  (click)="startEdit(req)"
                  (keydown.enter)="startEdit(req)"
                  tabindex="0"
                  role="button"
                >
                  <!-- Description -->
                  @if (req.description) {
                    <div [innerHTML]="req.description"></div>
                  } @else {
                    <span class="text-surface-400 italic">Click to add description…</span>
                  }

                  <!-- Traceability Chips -->
                  @if (req.traceUrsIds?.length) {
                    <div class="flex flex-wrap gap-1 mt-2">
                      <span class="text-xs font-semibold text-surface-500 mr-1">Traces to:</span>
                      @for (ursId of req.traceUrsIds; track ursId) {
                        <span
                          class="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 text-xs px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800"
                        >
                          {{ getUrsCode(ursId) }}
                        </span>
                      }
                    </div>
                  }
                </div>
              }
            </td>

            <td class="align-top pt-2">
              <div class="flex gap-1 justify-end">
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
            <td [colSpan]="5" class="text-center py-8">
              <span class="text-surface-500">No requirements defined.</span>
              <p-button label="Add Item" [link]="true" (click)="addRequirement()" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog />
  `,
})
export class FsCsRequirementsTable {
  private readonly fsCsService = inject(FsCsService);
  private readonly ursService = inject(UrsService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly lifecycleProjectId = input.required<string>();
  readonly reqType = input.required<FsCsRequirementType>();
  readonly title = input.required<string>();

  // State
  protected readonly requirements = signal<FsCsRequirement[]>([]);
  protected readonly ursRequirements = signal<UrsRequirement[]>([]);
  protected readonly loading = signal(true);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);

  // Edit State
  protected editDescription = '';
  protected editGroupName = '';
  protected editTraceUrsIds: string[] = [];
  protected groupSuggestions = signal<string[]>([]);

  private artifactId = '';

  // Derived Options for Traceability

  protected readonly ursOptionsSignal = signal<{ label: string; value: string }[]>([]);

  // Load data
  private readonly loadEffect = effect(() => {
    const projectId = this.lifecycleProjectId();
    if (!projectId) return;

    this.loading.set(true);

    // parallel load: FS/CS Artifact + URS Artifact (to get URS requirements)
    this.loadData(projectId);
  });

  private loadData(projectId: string) {
    // 1. Get FS/CS Artifact
    this.fsCsService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.artifactId = artifact.id;
        this.loadRequirements();
      },
      error: () => this.loading.set(false),
    });

    // 2. Get URS Requirements for options
    this.ursService.getOrCreateArtifact(projectId).subscribe({
      next: (ursArtifact) => {
        this.ursService.loadRequirements(ursArtifact.id).subscribe((ursReqs) => {
          this.ursRequirements.set(ursReqs);
          this.ursOptionsSignal.set(
            ursReqs.map((r) => ({
              label: `URS-${r.code} ${this.truncate(r.description, 30)}`,
              value: r.id,
            })),
          );
        });
      },
    });
  }

  private loadRequirements(): void {
    this.fsCsService.loadRequirements(this.artifactId, this.reqType()).subscribe({
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

    this.fsCsService.createRequirement(this.artifactId, this.reqType(), nextPosition).subscribe({
      next: (req) => {
        this.requirements.update((prev) => [...prev, req]);
        this.adding.set(false);
        this.startEdit(req);
      },
      error: () => this.adding.set(false),
    });
  }

  protected startEdit(req: FsCsRequirement): void {
    this.editingId.set(req.id);
    this.editDescription = req.description;
    this.editGroupName = req.groupName || '';
    this.editTraceUrsIds = [...req.traceUrsIds];
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.resetEditState();
  }

  protected saveEdit(req: FsCsRequirement): void {
    this.saving.set(true);
    this.fsCsService
      .updateRequirement(req.id, {
        description: this.editDescription,
        groupName: this.editGroupName,
        traceUrsIds: this.editTraceUrsIds,
      })
      .subscribe({
        next: (updated) => {
          this.requirements.update((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          this.editingId.set(null);
          this.resetEditState();
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  private resetEditState() {
    this.editDescription = '';
    this.editGroupName = '';
    this.editTraceUrsIds = [];
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

    this.requirements.set(reordered.map((req, index) => ({ ...req, position: index })));

    this.fsCsService.updatePositions(updates).subscribe({
      error: () => this.loadRequirements(),
    });
  }

  protected confirmDelete(req: FsCsRequirement): void {
    const prefix = this.getCodePrefix();
    this.confirmationService.confirm({
      message: `Delete ${prefix}-${req.code}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.fsCsService.deleteRequirement(req.id).subscribe({
          next: () => {
            this.requirements.update((prev) => prev.filter((r) => r.id !== req.id));
          },
        });
      },
    });
  }

  // Helpers
  protected getCodePrefix(): string {
    switch (this.reqType()) {
      case 'Functional':
        return 'FS';
      case 'Configuration':
        return 'CS';
      case 'Design':
        return 'DS';
      default:
        return 'REQ';
    }
  }

  protected getUrsCode(id: string): string {
    const urs = this.ursRequirements().find((u) => u.id === id);
    return urs ? `URS-${urs.code}` : '???';
  }

  protected ursOptions(): { label: string; value: string }[] {
    return this.ursOptionsSignal();
  }

  protected searchGroups(event: { query: string }): void {
    const query = event.query.toLowerCase();
    const existingGroups = Array.from(
      new Set(
        this.requirements()
          .map((r) => r.groupName)
          .filter((g): g is string => !!g),
      ),
    );
    this.groupSuggestions.set(existingGroups.filter((g) => g.toLowerCase().includes(query)));
  }

  private truncate(str: string, length: number): string {
    if (!str) return '';
    // Strip HTML tags for label
    const text = str.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
