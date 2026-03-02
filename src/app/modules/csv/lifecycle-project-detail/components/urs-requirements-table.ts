import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RichTextEditorComponent } from '@/shared/components/rich-text-editor/rich-text-editor.component';
import { DialogModule } from 'primeng/dialog';
import { UrsService } from '../../services/urs.service';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { UrsCategory, UrsRequirement } from '../../urs.interface';
import { AiActionButtonComponent } from '@/shared/components/ai-action-button/ai-action-button.component';
import { FsCsService } from '../../services/fs-cs.service';
import { FsCsRequirementType } from '../../fs-cs.interface';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-urs-requirements-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    RichTextEditorComponent,
    DialogModule,
    DialogModule,
    SelectModule,
    AutoCompleteModule,
    AiActionButtonComponent,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <!-- Toolbar -->
      <div class="relative flex items-center justify-between h-10">
        <h3 class="text-lg font-semibold m-0">User Requirements</h3>

        <!-- Default Actions -->
        <div
          class="flex gap-2 absolute right-0 transition-all duration-300 ease-in-out"
          [ngClass]="
            selectedItems().length > 0
              ? 'opacity-0 pointer-events-none translate-y-4'
              : 'opacity-100 translate-y-0'
          "
        >
          <app-ai-action-button
            action="csv.spec:generate-from-urs"
            label="Generate Specs"
            icon="pi pi-sparkles"
            size="small"
            severity="help"
            [outlined]="true"
            [context]="{ requirements: requirements(), system: system() }"
            (actionSuccess)="onSpecGenerationSuccess($event)"
            tooltip="Generate Specifications from these requirements"
          />
          <p-button
            label="Add Requirement"
            icon="pi pi-plus"
            size="small"
            (click)="addRequirement()"
            [loading]="adding()"
          />
        </div>

        <!-- Bulk Actions Toolbar -->
        <div
          class="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm absolute right-0 transition-all duration-300 ease-in-out z-10"
          [ngClass]="
            selectedItems().length === 0
              ? 'opacity-0 pointer-events-none -translate-y-4'
              : 'opacity-100 translate-y-0'
          "
        >
          <span class="text-sm font-semibold text-primary-700 dark:text-primary-300 mr-2">
            {{ selectedItems().length }} selected
          </span>
          <p-button
            icon="pi pi-tags"
            label="Group"
            size="small"
            [outlined]="true"
            (click)="openBulkGroupDialog()"
          />
          <p-button
            icon="pi pi-trash"
            label="Delete"
            severity="danger"
            size="small"
            [outlined]="true"
            (click)="confirmBulkDelete()"
          />
          <p-button
            icon="pi pi-times"
            [rounded]="true"
            [text]="true"
            size="small"
            (click)="selectedItems.set([])"
            pTooltip="Clear selection"
          />
        </div>
      </div>

      <!-- Table -->
      <p-table
        [value]="requirements()"
        [selection]="selectedItems()"
        (selectionChange)="selectedItems.set($event)"
        (onRowReorder)="onRowReorder($event)"
        [loading]="loading()"
        dataKey="id"
        styleClass="p-datatable-sm"
        [tableStyle]="{ 'table-layout': 'fixed', 'min-width': '60rem' }"
        rowGroupMode="subheader"
        groupRowsBy="groupName"
        sortField="position"
        sortMode="single"
      >
        <ng-template #header>
          <tr>
            <th style="width: 3rem" aria-label="Drag handle"></th>
            <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
            <th style="width: 5rem">Code</th>
            <th style="width: 10rem">Category</th>
            <th style="max-width: 40rem">Description</th>
            <th style="width: 12rem">Group</th>
            <th style="width: 8rem">Actions</th>
          </tr>
        </ng-template>

        <ng-template #groupheader let-req let-expanded="expanded">
          <tr pRowGroupHeader>
            <td colspan="7">
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
          <tr
            [pReorderableRow]="index"
            [class.bg-primary-50]="selectedItems().includes(req)"
            class="dark:bg-transparent"
          >
            <td class="align-top">
              <span class="pi pi-bars cursor-move mt-2" pReorderableRowHandle></span>
            </td>
            <td class="align-top">
              <p-tableCheckbox [value]="req" />
            </td>
            <td class="font-mono font-semibold align-top pt-3">URS-{{ req.code }}</td>
            <td class="align-top pt-2">
              @if (editingId() === req.id) {
                <p-select
                  [options]="categoryOptions"
                  [(ngModel)]="editCategory"
                  [style]="{ width: '100%' }"
                  appendTo="body"
                />
              } @else {
                <span [class.text-surface-400]="!req.category">{{ req.category }}</span>
              }
            </td>
            <td class="align-top">
              @if (editingId() === req.id) {
                <app-rich-text-editor
                  [(ngModel)]="editDescription"
                  [allowImages]="false"
                  [style]="{ height: '150px' }"
                />
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
                    <div
                      class="wrap-break-word whitespace-pre-wrap overflow-hidden"
                      [innerHTML]="req.description"
                    ></div>
                  } @else {
                    <span class="text-surface-400 italic">Click to add description…</span>
                  }
                </div>
              }
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
                />
              } @else {
                {{ req.groupName }}
              }
            </td>
            <td class="align-top pt-2">
              <div class="flex gap-1">
                <app-ai-action-button
                  action="csv.spec:assist"
                  label=""
                  [context]="{ description: req.description }"
                  tooltip="AI Assist"
                  icon="pi pi-sparkles"
                  [outlined]="true"
                  [text]="true"
                  severity="help"
                  size="small"
                  (actionSuccess)="onAiSuccess($event, req)"
                ></app-ai-action-button>
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
            <td [colSpan]="7" class="text-center py-8">
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

    <!-- AI Review Dialog -->
    <p-dialog
      header="AI Assistant Review"
      [(visible)]="reviewDialogVisible"
      [modal]="true"
      [style]="{ width: '50vw' }"
      [draggable]="false"
      [resizable]="false"
    >
      @if (aiReviewData) {
        <div class="flex flex-col gap-4">
          <div
            class="p-3 bg-surface-50 dark:bg-surface-900 rounded-md border border-surface-200 dark:border-surface-700"
          >
            <h4 class="font-semibold mb-2 text-primary-600">Critique</h4>
            <p class="m-0 text-sm whitespace-pre-wrap">{{ aiReviewData.critique }}</p>
          </div>

          <div>
            <h4 class="font-semibold mb-2 text-green-600">Recommendation</h4>
            <div
              class="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800"
            >
              <p class="m-0 italic" [innerHTML]="aiReviewData.recommendation"></p>
            </div>
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            label="Discard"
            icon="pi pi-times"
            (click)="closeReviewDialog()"
            severity="secondary"
            [text]="true"
          />
          <p-button
            label="Accept Recommendation"
            icon="pi pi-check"
            (click)="acceptAiRecommendation()"
            [disabled]="!aiReviewData?.recommendation"
            severity="success"
            [autofocus]="true"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Bulk Group Dialog -->
    <p-dialog
      header="Bulk Assign Group"
      [(visible)]="bulkGroupDialogVisible"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      <div class="flex flex-col gap-4 py-4">
        <p class="m-0 text-surface-600 dark:text-surface-400">
          Assigning a group to {{ selectedItems().length }} selected requirement(s).
        </p>
        <div class="flex flex-col gap-2">
          <label for="bulk-group-name" class="font-semibold text-sm">Group Name</label>
          <p-autoComplete
            inputId="bulk-group-name"
            [(ngModel)]="bulkGroupName"
            [suggestions]="groupSuggestions()"
            (completeMethod)="searchGroups($event)"
            [dropdown]="true"
            placeholder="Enter or select a group"
            appendTo="body"
            [style]="{ width: '100%' }"
          />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [text]="true"
            severity="secondary"
            (click)="bulkGroupDialogVisible = false"
          />
          <p-button
            label="Apply"
            icon="pi pi-check"
            (click)="applyBulkGroup()"
            [loading]="saving()"
          />
        </div>
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
  `,
})
export class UrsRequirementsTable {
  private readonly ursService = inject(UrsService);
  private readonly fsCsService = inject(FsCsService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly lifecycleProjectId = input.required<string>();
  readonly system = input<
    { name: string; version: string | null; description: string | null } | undefined
  >();

  // State
  protected readonly requirements = signal<UrsRequirement[]>([]);
  protected readonly loading = signal(true);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected editDescription = '';
  protected editCategory = signal<UrsCategory>('Functional');
  protected editGroupName = signal<string>('');

  protected readonly categoryOptions: UrsCategory[] = ['Functional', 'Configuration', 'Design'];
  protected groupSuggestions = signal<string[]>([]);

  // Bulk State
  protected readonly selectedItems = signal<UrsRequirement[]>([]);
  protected bulkGroupDialogVisible = false;
  protected bulkGroupName = '';

  // AI Review State
  protected reviewDialogVisible = false;
  protected aiReviewData: { critique: string; recommendation: string } | null = null;
  protected reviewingReq: UrsRequirement | null = null;

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
    // Position finding might be complex with groups, but we just add to end for now.
    // Ideally we find the max position.

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
    this.editCategory.set(req.category);
    this.editGroupName.set(req.groupName || '');
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editDescription = '';
    this.editCategory.set('Functional');
    this.editGroupName.set('');
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

  protected saveEdit(req: UrsRequirement): void {
    this.saving.set(true);
    this.ursService
      .updateRequirement(req.id, {
        description: this.editDescription,
        category: this.editCategory(),
        groupName: this.editGroupName() || null,
      })
      .subscribe({
        next: (updated) => {
          this.requirements.update((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          this.editingId.set(null);
          this.editDescription = '';
          this.editCategory.set('Functional');
          this.editGroupName.set('');
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

    // Determine new group based on neighbors
    let newGroup = moved.groupName;
    if (dropIndex > 0) {
      newGroup = reordered[dropIndex - 1].groupName;
    } else if (reordered.length > 1) {
      // If moved to the top, adopt the group of the item below (now at index 1)
      newGroup = reordered[1].groupName;
    }

    const groupChanged = moved.groupName !== newGroup;
    if (groupChanged) {
      moved.groupName = newGroup;

      this.ursService.updateRequirement(moved.id, { groupName: newGroup }).subscribe({
        error: () => this.loadRequirements(),
      });
    }

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
            this.selectedItems.update((prev) => prev.filter((r) => r.id !== req.id));
          },
        });
      },
    });
  }

  // Bulk Actions
  protected confirmBulkDelete(): void {
    const ids = this.selectedItems().map((r) => r.id);
    if (!ids.length) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${ids.length} selected requirement(s)?`,
      header: 'Confirm Bulk Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.ursService.deleteRequirements(ids).subscribe({
          next: () => {
            this.requirements.update((prev) => prev.filter((r) => !ids.includes(r.id)));
            this.selectedItems.set([]);
          },
        });
      },
    });
  }

  protected openBulkGroupDialog(): void {
    if (this.selectedItems().length === 0) return;
    this.bulkGroupName = '';
    this.bulkGroupDialogVisible = true;
  }

  protected applyBulkGroup(): void {
    const ids = this.selectedItems().map((r) => r.id);
    if (!ids.length) return;

    this.saving.set(true);
    this.ursService
      .bulkUpdateRequirements(ids, { groupName: this.bulkGroupName || null })
      .subscribe({
        next: () => {
          this.requirements.update((prev) =>
            prev.map((r) =>
              ids.includes(r.id) ? { ...r, groupName: this.bulkGroupName || null } : r,
            ),
          );
          this.saving.set(false);
          this.bulkGroupDialogVisible = false;
          this.selectedItems.set([]); // Clear selection after applying
        },
        error: () => this.saving.set(false),
      });
  }

  // AI Actions
  protected onAiSuccess(response: string, req: UrsRequirement): void {
    try {
      // Remove any markdown code fences if present (e.g. ```json ... ```)
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      this.aiReviewData = JSON.parse(cleanedResponse);
      this.reviewingReq = req;
      this.reviewDialogVisible = true;
    } catch (e) {
      console.error('Failed to parse AI response', e);
      // Fallback: just show the raw response as critique if not JSON
      this.aiReviewData = {
        critique: response,
        recommendation: '',
      };
      this.reviewingReq = req;
      this.reviewDialogVisible = true;
    }
  }

  protected closeReviewDialog(): void {
    this.reviewDialogVisible = false;
    this.aiReviewData = null;
    this.reviewingReq = null;
  }

  protected acceptAiRecommendation(): void {
    if (this.reviewingReq && this.aiReviewData?.recommendation) {
      this.editingId.set(this.reviewingReq.id);
      this.editDescription = this.aiReviewData.recommendation;
      this.editCategory.set(this.reviewingReq.category);
      this.editGroupName.set(this.reviewingReq.groupName || '');
      this.saveEdit(this.reviewingReq);
      this.closeReviewDialog();
    }
  }

  protected onSpecGenerationSuccess(response: string): void {
    try {
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const generatedReqs = JSON.parse(cleanedResponse);

      if (!Array.isArray(generatedReqs)) {
        throw new Error('AI response is not an array');
      }

      this.loading.set(true);

      // 1. Ensure FS/CS artifact exists
      this.fsCsService
        .getOrCreateArtifact(this.lifecycleProjectId())
        .pipe(
          switchMap((artifact) => {
            // 2. Create requirements with mixed types
            return this.fsCsService.createMixedRequirements(
              artifact.id,
              generatedReqs.map(
                (req: {
                  description: string;
                  groupName?: string;
                  reqType: FsCsRequirementType;
                  traceUrsIds?: string[];
                }) => ({
                  description: req.description,
                  groupName: req.groupName,
                  reqType: req.reqType,
                  traceUrsIds: req.traceUrsIds,
                }),
              ),
            );
          }),
        )
        .subscribe({
          next: () => {
            this.loading.set(false);
            // Optionally redirect to FS tab or show success message (handled in service)
          },
          error: () => this.loading.set(false),
        });
    } catch (e) {
      console.error('Failed to parse AI response for Spec generation', e);
      // Could show a toast here if needed
      this.loading.set(false);
    }
  }
}
