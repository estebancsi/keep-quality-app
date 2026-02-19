import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
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
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { RiskAnalysisService } from '../../services/risk-analysis.service';
import { RiskAnalysisItem } from '../../risk-analysis.interface';
import { UrsService } from '../../services/urs.service';
import { FsCsService } from '../../services/fs-cs.service';
import { UrsRequirement } from '../../urs.interface';
import { FsCsRequirement, FsCsRequirementType } from '../../fs-cs.interface';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-risk-analysis-table',
  standalone: true,
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
    RadioButtonModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <!-- Toolbar -->
      <div class="flex items-center justify-between">
        <h4 class="text-base font-semibold m-0">Risk Analysis (FMEA)</h4>
        <div class="flex gap-2">
          <p-button
            label="Add Risk Item"
            icon="pi pi-plus"
            size="small"
            (click)="addItem()"
            [loading]="adding()"
          />
        </div>
      </div>

      <!-- Table -->
      <p-table
        [value]="items()"
        (onRowReorder)="onRowReorder($event)"
        [loading]="loading()"
        dataKey="id"
        styleClass="p-datatable-sm"
        sortField="position"
        sortMode="single"
      >
        <ng-template #header>
          <tr>
            <th style="width: 3rem" aria-label="Drag handle"></th>
            <th style="width: 5rem">Code</th>
            <th style="width: 6rem">Traceability</th>
            <th>Failure Mode / Cause / Effect</th>
            <th style="width: 8rem" pTooltip="Severity (1=Low, 3=High)">Severity</th>
            <th style="width: 8rem" pTooltip="Probability (1=Low, 3=High)">Probability</th>
            <th style="width: 8rem" pTooltip="Detectability (1=High/Good, 3=Low/Bad)">
              Detectability
            </th>
            <th style="width: 5rem" pTooltip="Risk Class (1=High, 3=Low)">Class</th>
            <th style="width: 6rem" pTooltip="Risk Priority">Priority</th>
            <th style="width: 15rem">Mitigation</th>
            <th style="width: 5rem">Actions</th>
          </tr>
        </ng-template>

        <ng-template #body let-item let-index="rowIndex">
          <tr [pReorderableRow]="index">
            <!-- Drag Handle -->
            <td class="align-top">
              <span class="pi pi-bars cursor-move mt-2" pReorderableRowHandle></span>
            </td>

            <!-- Code -->
            <td class="align-top font-mono font-semibold pt-3">RA-{{ item.code }}</td>

            <!-- Traceability (New Column) -->
            <td class="align-top">
              @if (editingId() === item.id) {
                @if (systemCategory() === 4 || systemCategory() === 5) {
                  <!-- Cat 4/5: Link to FS/CS/DS -->
                  <div class="flex flex-col gap-1 fade-in">
                    <p-multiSelect
                      inputId="trace-fs-cs"
                      [options]="fsCsOptions()"
                      [(ngModel)]="editTraceFsCsIds"
                      optionLabel="code"
                      optionValue="value"
                      placeholder="Select FS/CS/DS"
                      [style]="{ width: '100%', minWidth: '10rem' }"
                      appendTo="body"
                      display="chip"
                    >
                      <ng-template let-item pTemplate="item">
                        <div class="flex flex-col">
                          <span class="font-semibold">{{ item.code }}</span>
                          <span class="text-sm text-surface-500">{{ item.description }}</span>
                        </div>
                      </ng-template>
                    </p-multiSelect>
                  </div>
                } @else if (systemCategory() === 3) {
                  <!-- Cat 3: Link to URS -->
                  <div class="flex flex-col gap-1 fade-in">
                    <p-multiSelect
                      inputId="trace-urs"
                      [options]="ursOptions()"
                      [(ngModel)]="editTraceUrsIds"
                      optionLabel="code"
                      optionValue="value"
                      placeholder="Select URS"
                      [style]="{ width: '100%', minWidth: '10rem' }"
                      appendTo="body"
                      display="chip"
                    >
                      <ng-template let-item pTemplate="item">
                        <div class="flex flex-col">
                          <span class="font-semibold">{{ item.code }}</span>
                          <span class="text-sm text-surface-500">{{ item.description }}</span>
                        </div>
                      </ng-template>
                    </p-multiSelect>
                  </div>
                } @else {
                  <div class="text-xs text-surface-500 italic mt-1">N/A</div>
                }
              } @else {
                <!-- Traceability Chips -->
                <div class="flex flex-wrap gap-1">
                  @for (fsCsId of item.traceFsCsIds; track fsCsId) {
                    <span
                      class="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                      pTooltip="Trace to Spec"
                    >
                      {{ getFsCsCode(fsCsId) }}
                    </span>
                  }
                  @for (ursId of item.traceUrsIds; track ursId) {
                    <span
                      class="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800"
                      pTooltip="Trace to URS"
                    >
                      {{ getUrsCode(ursId) }}
                    </span>
                  }
                </div>
              }
            </td>

            <!-- Failure Mode / Cause / Effect -->
            <td class="align-top">
              @if (editingId() === item.id) {
                <div class="flex flex-col gap-2">
                  <div class="flex flex-col">
                    <label class="text-xs font-semibold text-surface-500" for="edit-fm"
                      >Failure Mode</label
                    >
                    <textarea
                      id="edit-fm"
                      [(ngModel)]="editFailureMode"
                      class="w-full text-sm p-2 border border-surface-300 dark:border-surface-600 rounded focus:border-primary-500 outline-none bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0"
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-xs font-semibold text-surface-500" for="edit-cause"
                      >Cause</label
                    >
                    <textarea
                      id="edit-cause"
                      [(ngModel)]="editCause"
                      class="w-full text-sm p-2 border border-surface-300 dark:border-surface-600 rounded focus:border-primary-500 outline-none bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0"
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-xs font-semibold text-surface-500" for="edit-effect"
                      >Effect</label
                    >
                    <textarea
                      id="edit-effect"
                      [(ngModel)]="editEffect"
                      class="w-full text-sm p-2 border border-surface-300 dark:border-surface-600 rounded focus:border-primary-500 outline-none bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              } @else {
                <div
                  class="cursor-pointer min-h-16 p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex flex-col gap-1"
                  (click)="startEdit(item)"
                  (keydown.enter)="startEdit(item)"
                  tabindex="0"
                  role="button"
                >
                  <div class="text-sm">
                    <span class="font-semibold text-surface-500 text-xs">FM:</span>
                    {{ item.failureMode || '-' }}
                  </div>
                  <div class="text-sm">
                    <span class="font-semibold text-surface-500 text-xs">C:</span>
                    {{ item.cause || '-' }}
                  </div>
                  <div class="text-sm">
                    <span class="font-semibold text-surface-500 text-xs">E:</span>
                    {{ item.effect || '-' }}
                  </div>
                </div>
              }
            </td>

            <!-- Severity -->
            <td class="align-top pt-2">
              @if (editingId() === item.id) {
                <div class="flex flex-col gap-2">
                  @for (opt of severityOptions; track opt.value) {
                    <div class="flex items-center gap-2">
                      <p-radioButton
                        [inputId]="'sev-' + item.id + '-' + opt.value"
                        name="severity"
                        [value]="opt.value"
                        [ngModel]="editSeverity()"
                        (ngModelChange)="editSeverity.set($event)"
                      />
                      <label
                        [for]="'sev-' + item.id + '-' + opt.value"
                        class="text-sm cursor-pointer ml-1"
                        >{{ opt.label }}</label
                      >
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center font-mono">
                  {{ getSeverityLabel(item.severity) }} ({{ item.severity }})
                </div>
              }
            </td>

            <!-- Probability -->
            <td class="align-top pt-2">
              @if (editingId() === item.id) {
                <div class="flex flex-col gap-2">
                  @for (opt of probabilityOptions; track opt.value) {
                    <div class="flex items-center gap-2">
                      <p-radioButton
                        [inputId]="'prob-' + item.id + '-' + opt.value"
                        name="probability"
                        [value]="opt.value"
                        [ngModel]="editProbability()"
                        (ngModelChange)="editProbability.set($event)"
                      />
                      <label
                        [for]="'prob-' + item.id + '-' + opt.value"
                        class="text-sm cursor-pointer ml-1"
                        >{{ opt.label }}</label
                      >
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center font-mono">
                  {{ getProbabilityLabel(item.probability) }} ({{ item.probability }})
                </div>
              }
            </td>

            <!-- Detectability -->
            <td class="align-top pt-2">
              @if (editingId() === item.id) {
                <div class="flex flex-col gap-2">
                  @for (opt of detectabilityOptions; track opt.value) {
                    <div class="flex items-center gap-2">
                      <p-radioButton
                        [inputId]="'det-' + item.id + '-' + opt.value"
                        name="detectability"
                        [value]="opt.value"
                        [ngModel]="editDetectability()"
                        (ngModelChange)="editDetectability.set($event)"
                      />
                      <label
                        [for]="'det-' + item.id + '-' + opt.value"
                        class="text-sm cursor-pointer ml-1"
                        >{{ opt.label }}</label
                      >
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center font-mono">
                  {{ getDetectabilityLabel(item.detectability) }} ({{ item.detectability }})
                </div>
              }
            </td>

            <!-- Risk Class (Derived) -->
            <td class="align-top pt-2 text-center">
              @if (editingId() === item.id) {
                <p-tag
                  [severity]="getRiskClassSeverity(derivedRiskClass())"
                  [value]="'Class ' + derivedRiskClass()"
                />
              } @else {
                <p-tag
                  [severity]="getRiskClassSeverity(item.riskClass)"
                  [value]="'Class ' + item.riskClass"
                />
              }
            </td>

            <!-- Risk Priority (Derived from Class + Det) -->
            <td class="align-top pt-2 text-center">
              @if (editingId() === item.id) {
                <p-tag
                  [severity]="getPrioritySeverity(derivedRiskPriority())"
                  [value]="getPriorityLabel(derivedRiskPriority())"
                />
              } @else {
                <p-tag
                  [severity]="getPrioritySeverity(item.rpn)"
                  [value]="getPriorityLabel(item.rpn)"
                />
              }
            </td>

            <!-- Mitigation -->
            <td class="align-top">
              @if (editingId() === item.id) {
                <div class="flex flex-col gap-3">
                  <div class="flex flex-col">
                    <label class="text-xs font-semibold text-surface-500" for="edit-mitigation"
                      >Mitigation Details</label
                    >
                    <textarea
                      id="edit-mitigation"
                      [(ngModel)]="editMitigation"
                      class="w-full text-sm p-2 border border-surface-300 dark:border-surface-600 rounded focus:border-primary-500 outline-none bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-0"
                      rows="3"
                      aria-label="Mitigation Details"
                    ></textarea>
                  </div>

                  <div class="flex gap-2 mt-2">
                    <p-button
                      label="Save"
                      icon="pi pi-check"
                      size="small"
                      (click)="saveEdit(item)"
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
                  class="cursor-pointer min-h-16 p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  (click)="startEdit(item)"
                  (keydown.enter)="startEdit(item)"
                  tabindex="0"
                  role="button"
                >
                  @if (item.mitigation) {
                    <div class="mb-2 text-sm">{{ item.mitigation }}</div>
                  } @else {
                    <div class="text-surface-400 italic text-xs mb-2">No mitigation defined</div>
                  }
                </div>
              }
            </td>

            <!-- Actions -->
            <td class="align-top pt-2">
              <div class="flex gap-1 justify-end">
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  severity="danger"
                  size="small"
                  (click)="confirmDelete(item)"
                  pTooltip="Delete"
                />
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td [colSpan]="10" class="text-center py-8">
              <span class="text-surface-500">No risk items defined.</span>
              <p-button label="Add Item" [link]="true" (click)="addItem()" />
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmDialog />
  `,
  styles: [
    `
      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class RiskAnalysisTableComponent {
  private readonly riskService = inject(RiskAnalysisService);
  private readonly ursService = inject(UrsService);
  private readonly fsCsService = inject(FsCsService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly lifecycleProjectId = input.required<string>();
  readonly systemCategory = input<number>();

  // State
  protected readonly items = signal<RiskAnalysisItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);

  // Traceability Data
  protected readonly ursRequirements = signal<UrsRequirement[]>([]);
  protected readonly fsCsRequirements = signal<FsCsRequirement[]>([]);

  // Derived Options
  protected readonly ursOptions = computed(() =>
    this.ursRequirements().map((r) => ({
      code: `URS-${r.code}`,
      description: this.truncate(r.description, 40),
      label: `URS-${r.code} ${this.truncate(r.description, 40)}`,
      value: r.id,
    })),
  );
  protected readonly fsCsOptions = computed(() =>
    this.fsCsRequirements().map((r) => ({
      code: `${this.getPrefix(r.reqType)}-${r.code}`,
      description: this.truncate(r.description, 40),
      label: `${this.getPrefix(r.reqType)}-${r.code} ${this.truncate(r.description, 40)}`,
      value: r.id,
    })),
  );

  // Edit State
  protected editFailureMode = '';
  protected editCause = '';
  protected editEffect = '';
  protected editMitigation = '';
  protected editTraceUrsIds: string[] = [];
  protected editTraceFsCsIds: string[] = [];

  // Reactive State for Analysis
  protected readonly editSeverity = signal(1);
  protected readonly editProbability = signal(1);
  protected readonly editDetectability = signal(1);

  // Scale Options
  protected readonly severityOptions = [
    { label: 'Low', value: 1 },
    { label: 'Medium', value: 2 },
    { label: 'High', value: 3 },
  ];

  protected readonly probabilityOptions = [
    { label: 'Low', value: 1 },
    { label: 'Medium', value: 2 },
    { label: 'High', value: 3 },
  ];

  protected readonly detectabilityOptions = [
    { label: 'Low', value: 3 }, // Low Det = Bad
    { label: 'Medium', value: 2 },
    { label: 'High', value: 1 }, // High Det = Good
  ];

  // GAMP 5 Matrix Logic
  protected derivedRiskClass = computed(() => {
    return this.calculateRiskClass(this.editSeverity(), this.editProbability());
  });

  protected derivedRiskPriority = computed(() => {
    return this.calculateRiskPriority(this.derivedRiskClass(), this.editDetectability());
  });

  /*
   * GAMP 5 Matrix Implementation
   * S=3 (High), P=3 (High), D=3 (Low/Bad)
   * Risk Class: 1 (High), 2 (Med), 3 (Low)
   * Risk Priority: 3 (High/Red), 2 (Med/Yellow), 1 (Low/Green)
   */
  private calculateRiskClass(s: number, p: number): number {
    // Score S*P
    // High (Class 1): (3,3)=9, (3,2)=6, (2,3)=6
    // Med (Class 2): (3,1)=3, (2,2)=4, (1,3)=3
    // Low (Class 3): (2,1)=2, (1,2)=2, (1,1)=1
    const score = s * p;
    if (score >= 6) return 1;
    if (score >= 3) return 2;
    return 3;
  }

  private calculateRiskPriority(riskClass: number, d: number): number {
    // Risk Class 1 (High), 2 (Med), 3 (Low)
    // Detectability 3 (Low/Bad), 2 (Med), 1 (High/Good)

    // High Priority (3):
    // C1 + D3 (Low Det)
    // C1 + D2 (Med Det)
    // C2 + D3 (Low Det)
    if (riskClass === 1 && d === 3) return 3;
    if (riskClass === 1 && d === 2) return 3;
    if (riskClass === 2 && d === 3) return 3;

    // Medium Priority (2):
    // C1 + D1 (High Det) - Yellow
    // C2 + D2 (Med Det) - Yellow
    // C3 + D3 (Low Det) - Yellow
    if (riskClass === 1 && d === 1) return 2;
    if (riskClass === 2 && d === 2) return 2;
    if (riskClass === 3 && d === 3) return 2;

    // Low Priority (1):
    return 1;
  }

  private artifactId = '';

  // Load data
  private readonly loadEffect = effect(() => {
    const projectId = this.lifecycleProjectId();
    if (!projectId) return;

    this.loading.set(true);
    this.loadData(projectId);
  });

  private loadData(projectId: string) {
    // 1. Get Risk Artifact
    this.riskService.getOrCreateArtifact(projectId).subscribe({
      next: (artifact) => {
        this.artifactId = artifact.id;
        this.loadRiskItems();
      },
      error: () => this.loading.set(false),
    });

    // 2. Load URS/FS/CS for trace options
    this.loadTraceOptions(projectId);
  }

  private loadRiskItems() {
    this.riskService.loadItems(this.artifactId).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadTraceOptions(projectId: string) {
    // URS
    this.ursService
      .getOrCreateArtifact(projectId)
      .pipe(switchMap((artifact) => this.ursService.loadRequirements(artifact.id)))
      .subscribe({
        next: (reqs) => this.ursRequirements.set(reqs),
        error: (err) => console.error('Failed to load URS options', err),
      });

    // FS/CS
    this.fsCsService
      .getOrCreateArtifact(projectId)
      .pipe(switchMap((artifact) => this.fsCsService.loadRequirements(artifact.id)))
      .subscribe({
        next: (reqs) => this.fsCsRequirements.set(reqs),
        error: (err) => console.error('Failed to load FS/CS options', err),
      });
  }

  protected addItem(): void {
    this.adding.set(true);
    const nextPosition = this.items().length;

    this.riskService.createItem(this.artifactId, nextPosition).subscribe({
      next: (item) => {
        this.items.update((prev) => [...prev, item]);
        this.adding.set(false);
        this.startEdit(item);
      },
      error: () => this.adding.set(false),
    });
  }

  protected startEdit(item: RiskAnalysisItem): void {
    this.editingId.set(item.id);
    this.editFailureMode = item.failureMode;
    this.editCause = item.cause;
    this.editEffect = item.effect;
    this.editMitigation = item.mitigation;
    this.editTraceUrsIds = [...item.traceUrsIds];
    this.editTraceFsCsIds = [...item.traceFsCsIds];

    // Set signals
    this.editSeverity.set(item.severity);
    this.editProbability.set(item.probability);
    this.editDetectability.set(item.detectability);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.resetEditState();
  }

  protected saveEdit(item: RiskAnalysisItem): void {
    this.saving.set(true);
    const riskClass = this.derivedRiskClass();
    const priority = this.derivedRiskPriority();

    this.riskService
      .updateItem(item.id, {
        failureMode: this.editFailureMode,
        cause: this.editCause,
        effect: this.editEffect,
        severity: this.editSeverity(),
        probability: this.editProbability(),
        detectability: this.editDetectability(),
        mitigation: this.editMitigation,
        traceUrsIds: this.editTraceUrsIds,
        traceFsCsIds: this.editTraceFsCsIds,
        rpn: priority, // Storing Priority directly in "rpn" field for now
        riskClass: riskClass,
      })
      .subscribe({
        next: (updated) => {
          this.items.update((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          this.editingId.set(null);
          this.resetEditState();
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  protected onRowReorder(event: { dragIndex?: number; dropIndex?: number }): void {
    const dragIndex = event.dragIndex ?? 0;
    const dropIndex = event.dropIndex ?? 0;
    const reordered = [...this.items()];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const updates = reordered.map((item, index) => ({
      id: item.id,
      position: index,
    }));

    this.items.set(reordered.map((item, index) => ({ ...item, position: index })));

    this.riskService.updatePositions(updates).subscribe({
      error: () => this.loadRiskItems(),
    });
  }

  protected confirmDelete(item: RiskAnalysisItem): void {
    this.confirmationService.confirm({
      message: `Delete Risk Item RA-${item.code}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.riskService.deleteItem(item.id).subscribe({
          next: () => {
            this.items.update((prev) => prev.filter((r) => r.id !== item.id));
          },
        });
      },
    });
  }

  protected resetEditState() {
    this.editFailureMode = '';
    this.editCause = '';
    this.editEffect = '';
    this.editMitigation = '';
    this.editTraceUrsIds = [];
    this.editTraceFsCsIds = [];

    // Reset signals
    this.editSeverity.set(1);
    this.editProbability.set(1);
    this.editDetectability.set(1);
  }

  // Helpers
  protected getRiskClassSeverity(riskClass: number): 'success' | 'info' | 'warn' | 'danger' {
    if (riskClass === 1) return 'danger'; // High
    if (riskClass === 2) return 'warn'; // Med
    return 'success'; // Low
  }

  protected getPrioritySeverity(priority: number): 'success' | 'warn' | 'danger' {
    if (priority === 3) return 'danger';
    if (priority === 2) return 'warn';
    return 'success';
  }

  protected getPriorityLabel(priority: number): string {
    if (priority === 3) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
  }

  protected getSeverityLabel(val: number): string {
    const opt = this.severityOptions.find((o) => o.value === val);
    return opt ? opt.label : val.toString();
  }

  protected getProbabilityLabel(val: number): string {
    const opt = this.probabilityOptions.find((o) => o.value === val);
    return opt ? opt.label : val.toString();
  }

  protected getDetectabilityLabel(val: number): string {
    const opt = this.detectabilityOptions.find((o) => o.value === val);
    return opt ? opt.label : val.toString();
  }

  protected getPrefix(type: FsCsRequirementType): string {
    switch (type) {
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
    return urs ? `URS-${urs.code}` : '?';
  }

  protected getFsCsCode(id: string): string {
    const fsCs = this.fsCsRequirements().find((r) => r.id === id);
    return fsCs ? `${this.getPrefix(fsCs.reqType)}-${fsCs.code}` : '?';
  }

  protected truncate(str: string, length: number): string {
    if (!str) return '';
    const text = str.replace(/<[^>]*>/g, '');
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
