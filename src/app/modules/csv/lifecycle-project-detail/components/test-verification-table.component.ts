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
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';

import { TestProtocolService } from '../../services/test-protocol.service';
import {
  TestPhase,
  TestPassFailStatus,
  TestVerification,
  TestStep,
} from '../../test-protocol.interface';
// We also need to load URS, FS/CS, Risk for the MultiSelects
import { UrsService } from '../../services/urs.service';
import { FsCsService } from '../../services/fs-cs.service';
import { RiskAnalysisService } from '../../services/risk-analysis.service';
import { UrsArtifact, UrsRequirement } from '../../urs.interface';
import { FsCsArtifact, FsCsRequirement } from '../../fs-cs.interface';
import { RiskAnalysisArtifact, RiskAnalysisItem } from '../../risk-analysis.interface';
import { AiActionButtonComponent } from '@/shared/components/ai-action-button/ai-action-button.component';
import { forkJoin, of, catchError, switchMap, combineLatest } from 'rxjs';
import { Textarea } from 'primeng/textarea';
import { TestResultDrawerComponent } from './test-result-drawer.component';
import { AttachmentCache } from '@/core/interfaces/attachment.interface';

@Component({
  selector: 'app-test-verification-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    ConfirmDialogModule,
    SelectModule,
    InputTextModule,
    Textarea,
    MultiSelectModule,
    TagModule,
    AiActionButtonComponent,
    TestResultDrawerComponent,
    DialogModule,
  ],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3">
      <!-- Toolbar -->
      <div class="relative flex items-center justify-between mt-4 mb-3 h-10">
        <h3 class="text-lg font-semibold m-0">
          {{ phase() | uppercase }} Verifications / Test Scripts
        </h3>
        <!-- Default Actions -->
        <div
          class="flex items-center gap-2 absolute right-0 transition-all duration-300 ease-in-out"
          [ngClass]="
            selectedItems().length > 0
              ? 'opacity-0 pointer-events-none translate-y-4'
              : 'opacity-100 translate-y-0'
          "
        >
          <app-ai-action-button
            [action]="'csv.test-verifications:generate'"
            label="Generate Verifications"
            icon="pi pi-sparkles"
            size="small"
            severity="help"
            [outlined]="true"
            [context]="aiContextInput()"
            (actionSuccess)="onAiGenerationSuccess($event)"
            [tooltip]="'Generate Verifications for ' + (phase() | uppercase)"
            [disabled]="loading() || aiContextInput().items.length === 0"
          />
          <p-button
            label="Add Verification"
            icon="pi pi-plus"
            size="small"
            (click)="addVerification()"
            [loading]="addingVerification()"
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
            icon="pi pi-check-circle"
            label="Status"
            size="small"
            [outlined]="true"
            (click)="openBulkStatusDialog()"
          />
          <p-button
            icon="pi pi-link"
            label="Trace"
            size="small"
            [outlined]="true"
            (click)="openBulkTraceDialog()"
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

      <!-- Main Table for Verifications -->
      <p-table
        [value]="verifications()"
        [selection]="selectedItems()"
        (selectionChange)="selectedItems.set($event)"
        dataKey="id"
        [loading]="loading()"
        [expandedRowKeys]="expandedRows()"
        (onRowExpand)="onRowExpand($event)"
        styleClass="p-datatable-sm"
        [tableStyle]="{ 'table-layout': 'fixed', 'min-width': '75rem' }"
        (onRowReorder)="onVerificationReorder()"
      >
        <ng-template #header>
          <tr>
            <th style="width: 3rem"></th>
            <th style="width: 3rem"><p-tableHeaderCheckbox /></th>
            <th style="width: 3rem"></th>
            <th style="width: 5rem">Reference</th>
            <th style="width: 15rem">Objective</th>
            <th style="width: 15rem">Acceptance Criteria</th>
            <th style="width: 15rem">Traceability</th>
            <th style="width: 8rem">Status</th>
            <th style="width: 6rem">Actions</th>
          </tr>
        </ng-template>

        <ng-template #body let-ver let-expanded="expanded" let-index="rowIndex">
          <tr
            [pReorderableRow]="index"
            [class.bg-primary-50]="selectedItems().includes(ver)"
            class="bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 transition-colors"
          >
            <td><span class="pi pi-bars cursor-move" pReorderableRowHandle></span></td>
            <td><p-tableCheckbox [value]="ver" /></td>
            <td>
              <p-button
                type="button"
                pRipple
                [pRowToggler]="ver"
                [text]="true"
                [rounded]="true"
                plain
                [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
              />
            </td>

            @if (editingVerId() === ver.id) {
              <td class="font-mono font-semibold text-primary-600 dark:text-primary-400">
                {{ ver.reference }}
              </td>
              <td>
                <input
                  pInputText
                  [(ngModel)]="editVerObjective"
                  class="w-full"
                  placeholder="Objective"
                />
              </td>
              <td>
                <input
                  pInputText
                  [(ngModel)]="editVerAcceptance"
                  class="w-full"
                  placeholder="Acceptance Criteria"
                />
              </td>
              <td>
                <div class="flex flex-col gap-2">
                  <p-multiSelect
                    [options]="ursOptions()"
                    [(ngModel)]="editVerUrs"
                    placeholder="Select URS"
                    optionLabel="label"
                    optionValue="value"
                    appendTo="body"
                    styleClass="w-full"
                    display="chip"
                  />
                  <p-multiSelect
                    [options]="fsCsOptions()"
                    [(ngModel)]="editVerFsCs"
                    placeholder="Select FS/CS"
                    optionLabel="label"
                    optionValue="value"
                    appendTo="body"
                    styleClass="w-full"
                    display="chip"
                  />
                  <p-multiSelect
                    [options]="riskOptions()"
                    [(ngModel)]="editVerRisk"
                    placeholder="Select Risk"
                    optionLabel="label"
                    optionValue="value"
                    appendTo="body"
                    styleClass="w-full"
                    display="chip"
                  />
                </div>
              </td>
              <td>
                <p-select
                  [options]="statusOptions"
                  [(ngModel)]="editVerStatus"
                  [style]="{ width: '100%' }"
                  appendTo="body"
                />
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button
                    icon="pi pi-check"
                    size="small"
                    (click)="saveVerificationEdit(ver)"
                    [loading]="saving()"
                  />
                  <p-button
                    icon="pi pi-times"
                    size="small"
                    severity="secondary"
                    [outlined]="true"
                    (click)="cancelVerificationEdit()"
                  />
                </div>
              </td>
            } @else {
              <td class="font-mono font-semibold">{{ ver.reference }}</td>
              <td>
                <div class="wrap-break-word whitespace-pre-wrap overflow-hidden">
                  {{ ver.objective }}
                </div>
              </td>
              <td>
                <div class="wrap-break-word whitespace-pre-wrap overflow-hidden">
                  {{ ver.acceptanceCriteria }}
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  @for (id of ver.traceUrsIds; track id) {
                    <p-tag [value]="getUrsCode(id)" severity="info" />
                  }
                  @for (id of ver.traceFsCsIds; track id) {
                    <p-tag [value]="getFsCsCode(id)" severity="secondary" />
                  }
                  @for (id of ver.traceRiskIds; track id) {
                    <p-tag [value]="getRiskCode(id)" severity="warn" />
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="ver.status" [severity]="getStatusSeverity(ver.status)" />
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    size="small"
                    (click)="startVerificationEdit(ver)"
                    pTooltip="Edit"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    size="small"
                    (click)="deleteVerification(ver)"
                    pTooltip="Delete"
                  />
                </div>
              </td>
            }
          </tr>
        </ng-template>

        <!-- Expanded Row for Test Steps -->
        <ng-template #expandedrow let-ver>
          <tr>
            <td colspan="9">
              <div
                class="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-lg border border-surface-200 dark:border-surface-700"
              >
                <div class="flex justify-between items-center mb-3">
                  <h4 class="font-semibold text-primary-600 m-0">Test Steps</h4>
                  <p-button
                    label="Add Step"
                    icon="pi pi-plus"
                    size="small"
                    [text]="true"
                    (click)="addTestStep(ver)"
                  />
                </div>

                <p-table
                  [value]="testStepsMap()[ver.id] || []"
                  dataKey="id"
                  styleClass="p-datatable-sm"
                  [tableStyle]="{ 'table-layout': 'fixed', 'min-width': '65rem' }"
                  (onRowReorder)="onStepReorder($event, ver)"
                >
                  <ng-template #header>
                    <tr>
                      <th style="width: 3rem"></th>
                      <th style="width: 5rem">Step</th>
                      <th style="width: 20rem">Action</th>
                      <th style="width: 20rem">Expected Result</th>
                      <th style="width: 10rem">Data</th>
                      <th style="width: 7rem">Status</th>
                      <th style="width: 7rem">Actions</th>
                    </tr>
                  </ng-template>

                  <ng-template #body let-step let-stepIndex="rowIndex">
                    <tr [pReorderableRow]="stepIndex" class="bg-white dark:bg-surface-900">
                      <td><span class="pi pi-bars cursor-move" pReorderableRowHandle></span></td>

                      @if (editingStepId() === step.id) {
                        <td>
                          <input
                            pInputText
                            [(ngModel)]="editStepNumber"
                            class="w-full"
                            placeholder="1.1"
                          />
                        </td>
                        <td>
                          <textarea
                            pTextarea
                            [(ngModel)]="editStepAction"
                            rows="2"
                            class="w-full"
                          ></textarea>
                        </td>
                        <td>
                          <textarea
                            pTextarea
                            [(ngModel)]="editStepExpected"
                            rows="2"
                            class="w-full"
                          ></textarea>
                        </td>
                        <td>
                          <div class="flex flex-col gap-2">
                            <input
                              pInputText
                              [(ngModel)]="editStepData"
                              class="w-full"
                              placeholder="Data to Record"
                            />
                          </div>
                        </td>
                        <td>
                          <p-tag
                            [value]="step.status"
                            [severity]="getStatusSeverity(step.status)"
                          />
                        </td>
                        <td>
                          <div class="flex gap-1">
                            <p-button
                              icon="pi pi-check"
                              size="small"
                              (click)="saveStepEdit(step)"
                              [loading]="saving()"
                            />
                            <p-button
                              icon="pi pi-times"
                              size="small"
                              severity="secondary"
                              [outlined]="true"
                              (click)="cancelStepEdit()"
                            />
                          </div>
                        </td>
                      } @else {
                        <td class="font-mono">{{ step.stepNumber }}</td>
                        <td>
                          <div class="wrap-break-word whitespace-pre-wrap overflow-hidden">
                            {{ step.action }}
                          </div>
                        </td>
                        <td>
                          <div class="wrap-break-word whitespace-pre-wrap overflow-hidden">
                            {{ step.expectedResult }}
                          </div>
                        </td>
                        <td>
                          <div class="flex flex-col gap-2 items-start justify-center h-full">
                            @if (step.dataToRecord) {
                              <div class="text-sm">
                                <strong>Data:</strong> {{ step.dataToRecord }}
                              </div>
                            }
                            <p-button
                              label="Result"
                              icon="pi pi-file-edit"
                              size="small"
                              [outlined]="true"
                              [severity]="step.actualResult ? 'success' : 'secondary'"
                              (click)="openResultDrawer(step)"
                              [pTooltip]="
                                step.actualResult ? 'View/Edit Actual Result' : 'Add Actual Result'
                              "
                            />
                          </div>
                        </td>
                        <td>
                          <p-tag
                            [value]="step.status"
                            [severity]="getStatusSeverity(step.status)"
                          />
                        </td>
                        <td>
                          <div class="flex gap-1">
                            <p-button
                              icon="pi pi-pencil"
                              [rounded]="true"
                              [text]="true"
                              size="small"
                              (click)="startStepEdit(step)"
                              pTooltip="Edit"
                            />
                            <p-button
                              icon="pi pi-trash"
                              [rounded]="true"
                              [text]="true"
                              severity="danger"
                              size="small"
                              (click)="deleteStep(step)"
                              pTooltip="Delete"
                            />
                          </div>
                        </td>
                      }
                    </tr>
                  </ng-template>

                  <ng-template #emptymessage>
                    <tr>
                      <td colspan="8" class="text-center py-4 text-surface-500">
                        No steps added to this verification script.
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template #emptymessage>
          <tr>
            <td colspan="9" class="text-center py-8">
              <div class="flex flex-col items-center gap-2">
                <i class="pi pi-verified text-4xl text-surface-400"></i>
                <span class="text-surface-500">No {{ phase() | uppercase }} verifications yet</span>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <app-test-result-drawer
      [(visible)]="resultDrawerVisible"
      [step]="selectedStepForResult()"
      [saving]="savingResult()"
      (save)="onSaveActualResult($event)"
    />

    <!-- Bulk Status Dialog -->
    <p-dialog
      header="Bulk Update Status"
      [(visible)]="bulkStatusDialogVisible"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      <div class="flex flex-col gap-4 py-4">
        <p class="m-0 text-surface-600 dark:text-surface-400">
          Updating status for {{ selectedItems().length }} selected verification(s).
        </p>
        <div class="flex flex-col gap-2">
          <label for="bulk-status" class="font-semibold text-sm">Status</label>
          <p-select
            inputId="bulk-status"
            [options]="statusOptions"
            [(ngModel)]="bulkStatus"
            [style]="{ width: '100%' }"
            appendTo="body"
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
            (click)="bulkStatusDialogVisible = false"
          />
          <p-button
            label="Apply"
            icon="pi pi-check"
            (click)="applyBulkStatus()"
            [loading]="saving()"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Bulk Traceability Dialog -->
    <p-dialog
      header="Bulk Traceability"
      [(visible)]="bulkTraceDialogVisible"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      <div class="flex flex-col gap-4 py-4">
        <p class="m-0 text-surface-600 dark:text-surface-400">
          Tracing {{ selectedItems().length }} selected verification(s).
        </p>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="font-semibold text-sm">Select URS</label>
            <p-multiSelect
              [options]="ursOptions()"
              [(ngModel)]="bulkTraceUrsIds"
              placeholder="Select URS"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
              styleClass="w-full"
              display="chip"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-semibold text-sm">Select FS/CS</label>
            <p-multiSelect
              [options]="fsCsOptions()"
              [(ngModel)]="bulkTraceFsCsIds"
              placeholder="Select FS/CS"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
              styleClass="w-full"
              display="chip"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-semibold text-sm">Select Risk Items</label>
            <p-multiSelect
              [options]="riskOptions()"
              [(ngModel)]="bulkTraceRiskIds"
              placeholder="Select Risk"
              optionLabel="label"
              optionValue="value"
              appendTo="body"
              styleClass="w-full"
              display="chip"
            />
          </div>
          <small class="text-surface-500"
            >This will replace any existing traceability on URS, FS/CS, and Risk items for the
            selected verifications.</small
          >
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="flex justify-end gap-2">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            [text]="true"
            severity="secondary"
            (click)="bulkTraceDialogVisible = false"
          />
          <p-button
            label="Apply"
            icon="pi pi-check"
            (click)="applyBulkTrace()"
            [loading]="saving()"
          />
        </div>
      </ng-template>
    </p-dialog>

    <p-confirmDialog [key]="'test-proto-dialog'" />
  `,
})
export class TestVerificationTableComponent {
  private readonly testProtocolService = inject(TestProtocolService);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly ursService = inject(UrsService);
  private readonly fsCsService = inject(FsCsService);
  private readonly riskService = inject(RiskAnalysisService);

  readonly lifecycleProjectId = input.required<string>();
  readonly phase = input.required<TestPhase>();

  // State
  protected readonly protocolId = signal<string | null>(null);
  protected readonly verifications = signal<TestVerification[]>([]);
  protected readonly testStepsMap = signal<Record<string, TestStep[]>>({});

  protected readonly loading = signal(true);
  protected readonly addingVerification = signal(false);
  protected readonly saving = signal(false);

  protected expandedRows = signal<Record<string, boolean>>({});

  // Editing Verification
  protected editingVerId = signal<string | null>(null);
  protected editVerObjective = '';
  protected editVerAcceptance = '';
  protected editVerStatus: TestPassFailStatus = 'pending';
  protected editVerUrs: string[] = [];
  protected editVerFsCs: string[] = [];
  protected editVerRisk: string[] = [];

  protected editingStepId = signal<string | null>(null);
  protected editStepNumber = '';
  protected editStepAction = '';
  protected editStepExpected = '';
  protected editStepData = '';

  // Drawer state
  protected selectedStepForResult = signal<TestStep | null>(null);
  protected resultDrawerVisible = signal(false);
  protected savingResult = signal(false);

  readonly statusOptions: TestPassFailStatus[] = ['pending', 'pass', 'fail', 'n/a'];

  // Bulk State
  protected readonly selectedItems = signal<TestVerification[]>([]);
  protected bulkStatusDialogVisible = false;
  protected bulkStatus: TestPassFailStatus = 'pending';
  protected bulkTraceDialogVisible = false;
  protected bulkTraceUrsIds: string[] = [];
  protected bulkTraceFsCsIds: string[] = [];
  protected bulkTraceRiskIds: string[] = [];

  // Traceability Lookups
  protected readonly ursOptions = signal<{ label: string; value: string }[]>([]);
  protected readonly fsCsOptions = signal<{ label: string; value: string }[]>([]);
  protected readonly riskOptions = signal<{ label: string; value: string }[]>([]);

  protected readonly ursRequirements = signal<UrsRequirement[]>([]);
  protected readonly fsCsRequirements = signal<FsCsRequirement[]>([]);
  protected readonly riskItems = signal<RiskAnalysisItem[]>([]);

  protected readonly aiContextInput = computed(() => {
    const ph = this.phase();
    const risks = this.riskItems();
    const fscs = this.fsCsRequirements();
    const urs = this.ursRequirements();

    if (ph === 'iq') {
      const iqRisks = risks.filter((r) =>
        r.traceFsCsIds?.some((id) =>
          fscs.find(
            (f) => f.id === id && (f.reqType === 'Configuration' || f.reqType === 'Design'),
          ),
        ),
      );
      return {
        phase: 'iq',
        items: iqRisks.map((r) => ({
          risk: r,
          specs: fscs.filter((f) => r.traceFsCsIds?.includes(f.id)),
          urs: urs.filter((u) => r.traceUrsIds?.includes(u.id)),
        })),
      };
    } else if (ph === 'oq') {
      const oqRisks = risks.filter((r) =>
        r.traceFsCsIds?.some((id) => fscs.find((f) => f.id === id && f.reqType === 'Functional')),
      );
      return {
        phase: 'oq',
        items: oqRisks.map((r) => ({
          risk: r,
          specs: fscs.filter((f) => r.traceFsCsIds?.includes(f.id)),
          urs: urs.filter((u) => r.traceUrsIds?.includes(u.id)),
        })),
      };
    } else {
      // pq
      return {
        phase: 'pq',
        items: urs.map((u) => ({
          urs: u,
        })),
      };
    }
  });

  private readonly loadEffect = effect(() => {
    const projectId = this.lifecycleProjectId();
    const phaseVal = this.phase();
    if (!projectId || !phaseVal) return;

    this.loading.set(true);

    // 1. Get or Create Protocol Artifact
    this.testProtocolService.getOrCreateArtifact(projectId, phaseVal).subscribe({
      next: (artifact) => {
        this.protocolId.set(artifact.id);

        // 2. Load Traceability Sources (URS, FS/CS, Risks) concurrently
        this.loadTraceSources(projectId);

        // 3. Load Verifications
        this.loadVerifications(artifact.id);
      },
      error: () => this.loading.set(false),
    });
  });

  private loadTraceSources(projectId: string) {
    // Load URS
    this.ursService
      .getOrCreateArtifact(projectId)
      .pipe(
        switchMap((art: UrsArtifact) => this.ursService.loadRequirements(art.id)),
        catchError(() => of([] as UrsRequirement[])),
      )
      .subscribe((reqs: UrsRequirement[]) => {
        this.ursRequirements.set(reqs);
        this.ursOptions.set(
          reqs.map((r: UrsRequirement) => ({ label: `URS-${r.code}`, value: r.id })),
        );
      });

    // Load FS/CS
    this.fsCsService.getOrCreateArtifact(projectId).subscribe({
      next: (art: FsCsArtifact) => {
        combineLatest([
          this.fsCsService
            .loadRequirements(art.id, 'Functional')
            .pipe(catchError(() => of([] as FsCsRequirement[]))),
          this.fsCsService
            .loadRequirements(art.id, 'Configuration')
            .pipe(catchError(() => of([] as FsCsRequirement[]))),
          this.fsCsService
            .loadRequirements(art.id, 'Design')
            .pipe(catchError(() => of([] as FsCsRequirement[]))),
        ]).subscribe(
          ([func, conf, ds]: [FsCsRequirement[], FsCsRequirement[], FsCsRequirement[]]) => {
            const allTypes = [...func, ...conf, ...ds];
            this.fsCsRequirements.set(allTypes);
            this.fsCsOptions.set(
              allTypes.map((r: FsCsRequirement) => {
                const prefix =
                  r.reqType === 'Functional' ? 'FS' : r.reqType === 'Configuration' ? 'CS' : 'DS';
                return { label: `${prefix}-${r.code}`, value: r.id };
              }),
            );
          },
        );
      },
    });

    // Load Risks
    this.riskService
      .getOrCreateArtifact(projectId)
      .pipe(
        switchMap((art: RiskAnalysisArtifact) => this.riskService.loadItems(art.id)),
        catchError(() => of([] as RiskAnalysisItem[])),
      )
      .subscribe((risks: RiskAnalysisItem[]) => {
        this.riskItems.set(risks);
        this.riskOptions.set(
          risks.map((r: RiskAnalysisItem) => ({ label: `RISK-${r.code}`, value: r.id })),
        );
      });
  }

  private loadVerifications(protocolId: string) {
    this.testProtocolService.loadVerifications(protocolId).subscribe({
      next: (vers) => {
        this.verifications.set(vers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // --- Verification Actions ---

  addVerification() {
    const pId = this.protocolId();
    if (!pId) return;

    this.addingVerification.set(true);

    const phasePrefix = this.phase().toUpperCase() + '-';
    const currentMax = this.verifications().reduce((max, ver) => {
      if (ver.reference.startsWith(phasePrefix)) {
        const numPart = ver.reference.slice(phasePrefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num)) {
          return Math.max(max, num);
        }
      }
      return max;
    }, 0);
    const nextRef = `${phasePrefix}${currentMax + 1}`;

    this.testProtocolService
      .saveVerification(
        {
          reference: nextRef,
          objective: 'New Test Objective',
        },
        pId,
      )
      .subscribe({
        next: (newVer) => {
          this.verifications.update((prev) => [...prev, newVer]);
          this.addingVerification.set(false);
          this.startVerificationEdit(newVer);
        },
        error: () => this.addingVerification.set(false),
      });
  }

  startVerificationEdit(ver: TestVerification) {
    this.editingVerId.set(ver.id);
    this.editVerObjective = ver.objective || '';
    this.editVerAcceptance = ver.acceptanceCriteria || '';
    this.editVerStatus = ver.status || 'pending';
    this.editVerUrs = ver.traceUrsIds ? [...ver.traceUrsIds] : [];
    this.editVerFsCs = ver.traceFsCsIds ? [...ver.traceFsCsIds] : [];
    this.editVerRisk = ver.traceRiskIds ? [...ver.traceRiskIds] : [];
  }

  cancelVerificationEdit() {
    this.editingVerId.set(null);
  }

  saveVerificationEdit(ver: TestVerification) {
    const pId = this.protocolId();
    if (!pId) return;

    this.saving.set(true);
    this.testProtocolService
      .saveVerification(
        {
          id: ver.id,
          reference: ver.reference,
          objective: this.editVerObjective,
          acceptanceCriteria: this.editVerAcceptance,
          status: this.editVerStatus,
          traceUrsIds: this.editVerUrs,
          traceFsCsIds: this.editVerFsCs,
          traceRiskIds: this.editVerRisk,
          orderIndex: ver.orderIndex,
        },
        pId,
      )
      .subscribe({
        next: (updated) => {
          this.verifications.update((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
          this.cancelVerificationEdit();
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  deleteVerification(ver: TestVerification) {
    this.confirmationService.confirm({
      key: 'test-proto-dialog',
      message: `Are you sure you want to delete verification ${ver.reference}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.testProtocolService.deleteVerification(ver.id).subscribe({
          next: () => {
            this.verifications.update((prev) => prev.filter((v) => v.id !== ver.id));
          },
        });
      },
    });
  }

  onVerificationReorder() {
    const reordered = [...this.verifications()];
    const updates = reordered.map((v, index) => ({
      id: v.id,
      orderIndex: index,
    }));

    this.verifications.set(reordered.map((v, index) => ({ ...v, orderIndex: index })));
    this.testProtocolService.bulkSortVerifications(updates).subscribe();
  }

  // --- Bulk Actions ---
  protected confirmBulkDelete(): void {
    const ids = this.selectedItems().map((v) => v.id);
    if (!ids.length) return;

    this.confirmationService.confirm({
      key: 'test-proto-dialog',
      message: `Are you sure you want to delete ${ids.length} selected verification(s)?`,
      header: 'Confirm Bulk Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.testProtocolService.deleteVerifications(ids).subscribe({
          next: () => {
            this.verifications.update((prev) => prev.filter((v) => !ids.includes(v.id)));
            this.selectedItems.set([]);
          },
        });
      },
    });
  }

  protected openBulkStatusDialog(): void {
    if (this.selectedItems().length === 0) return;
    this.bulkStatus = 'pending';
    this.bulkStatusDialogVisible = true;
  }

  protected applyBulkStatus(): void {
    const ids = this.selectedItems().map((v) => v.id);
    if (!ids.length) return;

    this.saving.set(true);
    this.testProtocolService.bulkUpdateVerifications(ids, { status: this.bulkStatus }).subscribe({
      next: () => {
        this.verifications.update((prev) =>
          prev.map((v) => (ids.includes(v.id) ? { ...v, status: this.bulkStatus } : v)),
        );
        this.saving.set(false);
        this.bulkStatusDialogVisible = false;
        this.selectedItems.set([]);
      },
      error: () => this.saving.set(false),
    });
  }

  protected openBulkTraceDialog(): void {
    if (this.selectedItems().length === 0) return;
    this.bulkTraceUrsIds = [];
    this.bulkTraceFsCsIds = [];
    this.bulkTraceRiskIds = [];
    this.bulkTraceDialogVisible = true;
  }

  protected applyBulkTrace(): void {
    const ids = this.selectedItems().map((v) => v.id);
    if (!ids.length) return;

    this.saving.set(true);
    this.testProtocolService
      .bulkUpdateVerifications(ids, {
        traceUrsIds: this.bulkTraceUrsIds,
        traceFsCsIds: this.bulkTraceFsCsIds,
        traceRiskIds: this.bulkTraceRiskIds,
      })
      .subscribe({
        next: () => {
          this.verifications.update((prev) =>
            prev.map((v) =>
              ids.includes(v.id)
                ? {
                    ...v,
                    traceUrsIds: [...this.bulkTraceUrsIds],
                    traceFsCsIds: [...this.bulkTraceFsCsIds],
                    traceRiskIds: [...this.bulkTraceRiskIds],
                  }
                : v,
            ),
          );
          this.saving.set(false);
          this.bulkTraceDialogVisible = false;
          this.selectedItems.set([]);
        },
        error: () => this.saving.set(false),
      });
  }

  // --- Expanded Row logic ---

  onRowExpand(event: { data: TestVerification }) {
    const ver = event.data as TestVerification;
    // Load steps if not loaded
    if (!this.testStepsMap()[ver.id]) {
      this.testProtocolService.loadTestSteps(ver.id).subscribe({
        next: (steps) => {
          this.testStepsMap.update((prev) => ({ ...prev, [ver.id]: steps }));
        },
      });
    }
  }

  // --- Test Steps Actions ---

  addTestStep(ver: TestVerification) {
    const currentSteps = this.testStepsMap()[ver.id] || [];
    const nextNum = currentSteps.length + 1;

    this.testProtocolService
      .saveTestStep(
        {
          stepNumber: `${nextNum}.0`,
          action: 'New action',
        },
        ver.id,
      )
      .subscribe({
        next: (newStep) => {
          this.testStepsMap.update((prev) => ({
            ...prev,
            [ver.id]: [...(prev[ver.id] || []), newStep],
          }));
          this.startStepEdit(newStep);
        },
      });
  }

  startStepEdit(step: TestStep) {
    this.editingStepId.set(step.id);
    this.editStepNumber = step.stepNumber;
    this.editStepAction = step.action || '';
    this.editStepExpected = step.expectedResult || '';
    this.editStepData = step.dataToRecord || '';
  }

  cancelStepEdit() {
    this.editingStepId.set(null);
  }

  saveStepEdit(step: TestStep) {
    this.saving.set(true);
    this.testProtocolService
      .saveTestStep(
        {
          id: step.id,
          stepNumber: this.editStepNumber,
          action: this.editStepAction,
          expectedResult: this.editStepExpected,
          dataToRecord: this.editStepData,
          actualResult: step.actualResult,
          attachmentUrls: step.attachmentUrls,
          status: step.status,
          orderIndex: step.orderIndex,
        },
        step.testVerificationId,
      )
      .subscribe({
        next: (updated) => {
          this.testStepsMap.update((prev) => {
            const list = prev[updated.testVerificationId] || [];
            return {
              ...prev,
              [updated.testVerificationId]: list.map((s) => (s.id === updated.id ? updated : s)),
            };
          });
          this.cancelStepEdit();
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  openResultDrawer(step: TestStep) {
    this.selectedStepForResult.set(step);
    this.resultDrawerVisible.set(true);
  }

  onSaveActualResult(event: {
    stepId: string;
    actualResult: string;
    attachmentUrls: AttachmentCache[];
    status: 'pending' | 'pass' | 'fail' | 'n/a';
  }) {
    const step = this.selectedStepForResult();
    if (!step) return;

    this.savingResult.set(true);
    const updatedStepPayload = {
      ...step,
      actualResult: event.actualResult,
      attachmentUrls: event.attachmentUrls,
      status: event.status,
    };

    this.testProtocolService.saveTestStep(updatedStepPayload, step.testVerificationId).subscribe({
      next: (updated) => {
        this.testStepsMap.update((prev) => {
          const list = prev[updated.testVerificationId] || [];
          return {
            ...prev,
            [updated.testVerificationId]: list.map((s) => (s.id === updated.id ? updated : s)),
          };
        });
        this.selectedStepForResult.set(updated);
        this.savingResult.set(false);
        this.resultDrawerVisible.set(false);
      },
      error: () => this.savingResult.set(false),
    });
  }

  deleteStep(step: TestStep) {
    this.confirmationService.confirm({
      key: 'test-proto-dialog',
      message: `Are you sure you want to delete step ${step.stepNumber}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.testProtocolService.deleteTestStep(step.id).subscribe({
          next: () => {
            this.testStepsMap.update((prev) => {
              const list = prev[step.testVerificationId] || [];
              return {
                ...prev,
                [step.testVerificationId]: list.filter((s) => s.id !== step.id),
              };
            });
          },
        });
      },
    });
  }

  onStepReorder(event: { dragIndex?: number; dropIndex?: number }, ver: TestVerification) {
    const list = this.testStepsMap()[ver.id] || [];
    const reordered = [...list];
    const dragIndex = event.dragIndex ?? 0;
    const dropIndex = event.dropIndex ?? 0;
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const updates = reordered.map((s, index) => ({
      id: s.id,
      orderIndex: index,
    }));

    this.testStepsMap.update((prev) => ({
      ...prev,
      [ver.id]: reordered.map((s, index) => ({ ...s, orderIndex: index })),
    }));

    this.testProtocolService.bulkSortTestSteps(updates).subscribe();
  }

  // --- Display Helpers ---

  getUrsCode(id: string) {
    return this.ursOptions().find((o) => o.value === id)?.label || 'Unknown URS';
  }
  getFsCsCode(id: string) {
    return this.fsCsOptions().find((o) => o.value === id)?.label || 'Unknown Spec';
  }
  getRiskCode(id: string) {
    return this.riskOptions().find((o) => o.value === id)?.label || 'Unknown Risk';
  }

  getStatusSeverity(status: string): 'success' | 'danger' | 'info' | 'warn' {
    switch (status) {
      case 'pass':
        return 'success';
      case 'fail':
        return 'danger';
      case 'n/a':
        return 'info';
      default:
        return 'warn';
    }
  }

  // --- AI Actions ---
  onAiGenerationSuccess(response: string) {
    try {
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const generatedVers = JSON.parse(cleanedResponse);

      if (!Array.isArray(generatedVers)) {
        throw new Error('AI response is not an array');
      }

      const pId = this.protocolId();
      if (!pId) return;

      this.loading.set(true);

      const phasePrefix = this.phase().toUpperCase() + '-';
      let currentMax = this.verifications().reduce((max, ver) => {
        if (ver.reference.startsWith(phasePrefix)) {
          const numPart = ver.reference.slice(phasePrefix.length);
          const num = parseInt(numPart, 10);
          if (!isNaN(num)) {
            return Math.max(max, num);
          }
        }
        return max;
      }, 0);

      const newVerifications = generatedVers.map((v) => {
        currentMax++;
        return {
          reference: `${phasePrefix}${currentMax}`,
          objective: v.objective || '',
          acceptanceCriteria: v.acceptanceCriteria || '',
          status: 'pending' as TestPassFailStatus,
          traceUrsIds: v.traceUrsIds || [],
          traceFsCsIds: v.traceFsCsIds || [],
          traceRiskIds: v.traceRiskIds || [],
        };
      });

      const requests = newVerifications.map((v, i) =>
        this.testProtocolService.saveVerification(
          { ...v, orderIndex: this.verifications().length + i },
          pId,
        ),
      );

      if (requests.length === 0) {
        this.loading.set(false);
        return;
      }

      forkJoin(requests).subscribe({
        next: (createdVers) => {
          this.verifications.update((prev) => [...prev, ...createdVers]);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } catch (e) {
      console.error('Failed to parse AI response for Verifications generation', e);
      this.loading.set(false);
    }
  }
}
