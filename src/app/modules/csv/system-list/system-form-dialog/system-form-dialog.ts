import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  ComputerizedSystem,
  computeRiskLevel,
  CsvCategory,
  CUSTOM_CODING_OPTIONS,
  LIFECYCLE_STATUS_OPTIONS,
  RiskLevel,
  VALIDATION_STATUS_OPTIONS,
} from '../../computerized-systems.interface';

@Component({
  selector: 'app-system-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    DatePickerModule,
    ButtonModule,
    TabsModule,
    TagModule,
    TooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="system() ? 'Edit System' : 'New Computerized System'"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [style]="{ width: '720px' }"
      [closable]="true"
      [draggable]="false"
    >
      <form [formGroup]="form" class="flex flex-col h-full">
        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">General</p-tab>
            <p-tab value="1">Status</p-tab>
            <p-tab value="2">Risk & Compliance</p-tab>
            <p-tab value="3">Periodic Review</p-tab>
          </p-tablist>
          <p-tabpanels>
            <!-- General Tab -->
            <p-tabpanel value="0">
              <div class="flex flex-col gap-4 pt-4">
                <div class="flex flex-col gap-1">
                  <label for="sys-name" class="font-semibold text-sm">Name *</label>
                  <input
                    pInputText
                    id="sys-name"
                    formControlName="name"
                    placeholder="System name"
                  />
                  @if (form.controls.name.invalid && form.controls.name.touched) {
                    <small class="text-red-500">Name is required</small>
                  }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                    <label for="sys-version" class="font-semibold text-sm">Version</label>
                    <input
                      pInputText
                      id="sys-version"
                      formControlName="version"
                      placeholder="e.g., 3.2.1"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="sys-custom-coding" class="font-semibold text-sm"
                      >Custom Coding</label
                    >
                    <p-select
                      id="sys-custom-coding"
                      formControlName="customCoding"
                      [options]="customCodingOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select coding type"
                      [showClear]="true"
                      appendTo="body"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="sys-location" class="font-semibold text-sm"
                    >Location (Physical/Logical)</label
                  >
                  <input
                    pInputText
                    id="sys-location"
                    formControlName="location"
                    placeholder="e.g., Quality Control Laboratory, Cloud/SaaS"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <label for="sys-category" class="font-semibold text-sm">Category (GAMP 5)</label>
                  <p-select
                    id="sys-category"
                    formControlName="categoryId"
                    [options]="categories()"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select category"
                    [showClear]="true"
                    appendTo="body"
                  >
                    <ng-template #selectedItem let-selected>
                      @if (selected) {
                        @if (selected.name) {
                          <span>Cat. {{ selected.code }} — {{ selected.name }}</span>
                        } @else {
                          <span
                            >Cat. {{ getCategoryById(selected)?.code }} —
                            {{ getCategoryById(selected)?.name }}</span
                          >
                        }
                      }
                    </ng-template>
                    <ng-template #item let-item>
                      <div class="flex flex-col">
                        <span class="font-semibold">Cat. {{ item.code }} — {{ item.name }}</span>
                        @if (item.typicalExamples) {
                          <small class="text-surface-500">{{ item.typicalExamples }}</small>
                        }
                      </div>
                    </ng-template>
                  </p-select>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="sys-description" class="font-semibold text-sm">
                    Description / Intended Use
                  </label>
                  <textarea
                    pTextarea
                    id="sys-description"
                    formControlName="description"
                    [rows]="3"
                    placeholder="Describe what the system does and the business process it supports…"
                  >
                  </textarea>
                </div>
              </div>
            </p-tabpanel>

            <!-- Status Tab -->
            <p-tabpanel value="1">
              <div class="flex flex-col gap-4 pt-4">
                <div class="flex flex-col gap-1">
                  <label for="sys-lifecycle" class="font-semibold text-sm">Lifecycle Status</label>
                  <p-select
                    id="sys-lifecycle"
                    formControlName="lifecycleStatus"
                    [options]="lifecycleOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select lifecycle status"
                    appendTo="body"
                  />
                </div>

                <div class="flex flex-col gap-1">
                  <label for="sys-validation" class="font-semibold text-sm"
                    >Validation Status</label
                  >
                  <p-select
                    id="sys-validation"
                    formControlName="validationStatus"
                    [options]="validationOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select validation status"
                    appendTo="body"
                  />
                </div>
              </div>
            </p-tabpanel>

            <!-- Risk & Compliance Tab -->
            <p-tabpanel value="2">
              <div class="flex flex-col gap-4 pt-4">
                <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                  <h4 class="font-semibold mb-3 text-base">Initial Risk Assessment</h4>
                  <p class="text-sm text-surface-500 mb-4">
                    Answer the following questions to determine the system's risk level.
                  </p>

                  <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2">
                      <p-checkbox
                        formControlName="riskPatientSafety"
                        [binary]="true"
                        inputId="risk-ps"
                      />
                      <label for="risk-ps" class="text-sm">
                        Does this system have a direct impact on <strong>patient safety</strong>?
                      </label>
                    </div>

                    <div class="flex items-center gap-2">
                      <p-checkbox
                        formControlName="riskProductQuality"
                        [binary]="true"
                        inputId="risk-pq"
                      />
                      <label for="risk-pq" class="text-sm">
                        Does this system have a direct impact on <strong>product quality</strong>?
                      </label>
                    </div>

                    <div class="flex items-center gap-2">
                      <p-checkbox
                        formControlName="riskDataIntegrity"
                        [binary]="true"
                        inputId="risk-di"
                      />
                      <label for="risk-di" class="text-sm">
                        Does this system have a direct impact on <strong>data integrity</strong>?
                      </label>
                    </div>
                  </div>

                  <div class="mt-4 flex items-center gap-2">
                    <span class="text-sm font-semibold">Overall Risk Level:</span>
                    <p-tag [value]="riskLevelLabel()" [severity]="riskSeverity()" />
                  </div>
                </div>

                <div class="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                  <h4 class="font-semibold mb-3 text-base">Data Integrity</h4>
                  <div class="flex items-center gap-2">
                    <p-checkbox formControlName="alcoaRelevant" [binary]="true" inputId="alcoa" />
                    <label for="alcoa" class="text-sm">
                      Is this system relevant for
                      <strong
                        pTooltip="Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available"
                        tooltipPosition="top"
                      >
                        ALCOA+
                      </strong>
                      / 21 CFR Part 11 / Annex 11?
                    </label>
                  </div>
                </div>
              </div>
            </p-tabpanel>

            <!-- Periodic Review Tab -->
            <p-tabpanel value="3">
              <div class="flex flex-col gap-4 pt-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                    <label for="sys-last-review" class="font-semibold text-sm"
                      >Last Review Date</label
                    >
                    <p-datepicker
                      id="sys-last-review"
                      formControlName="lastReviewDate"
                      dateFormat="yy-mm-dd"
                      [showIcon]="true"
                      [showClear]="true"
                      placeholder="Select date"
                      appendTo="body"
                    />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label for="sys-next-review" class="font-semibold text-sm"
                      >Next Review Date</label
                    >
                    <p-datepicker
                      id="sys-next-review"
                      formControlName="nextReviewDate"
                      dateFormat="yy-mm-dd"
                      [showIcon]="true"
                      [showClear]="true"
                      placeholder="Select date"
                      appendTo="body"
                    />
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <label for="sys-review-notes" class="font-semibold text-sm">Review Notes</label>
                  <textarea
                    pTextarea
                    id="sys-review-notes"
                    formControlName="reviewNotes"
                    [rows]="3"
                    placeholder="Notes from the last periodic review…"
                  >
                  </textarea>
                </div>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </form>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button label="Cancel" severity="secondary" (click)="cancel()" />
          <p-button
            [label]="system() ? 'Update' : 'Create'"
            (click)="save()"
            [disabled]="form.invalid || saving()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class SystemFormDialog {
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly visible = input(false);
  readonly system = input<ComputerizedSystem | null>(null);
  readonly categories = input<CsvCategory[]>([]);

  // Outputs
  readonly visibleChange = output<boolean>();
  readonly saved = output<Partial<ComputerizedSystem>>();

  // State
  protected readonly saving = signal(false);

  // Options
  protected readonly lifecycleOptions = LIFECYCLE_STATUS_OPTIONS;
  protected readonly validationOptions = VALIDATION_STATUS_OPTIONS;
  protected readonly customCodingOptions = CUSTOM_CODING_OPTIONS;

  // Form
  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    version: [''],
    location: [''],
    description: [''],
    categoryId: [''],
    customCoding: [''],
    lifecycleStatus: ['draft'],
    validationStatus: ['not_validated'],
    riskPatientSafety: [false],
    riskProductQuality: [false],
    riskDataIntegrity: [false],
    alcoaRelevant: [false],
    lastReviewDate: [null as Date | null],
    nextReviewDate: [null as Date | null],
    reviewNotes: [''],
  });

  // Risk level signals react to form changes directly
  private readonly riskPatientSafety = toSignal(this.form.controls.riskPatientSafety.valueChanges, {
    initialValue: false,
  });
  private readonly riskProductQuality = toSignal(
    this.form.controls.riskProductQuality.valueChanges,
    { initialValue: false },
  );
  private readonly riskDataIntegrity = toSignal(this.form.controls.riskDataIntegrity.valueChanges, {
    initialValue: false,
  });

  protected readonly riskLevel = computed<RiskLevel>(() =>
    computeRiskLevel(
      !!this.riskPatientSafety(),
      !!this.riskProductQuality(),
      !!this.riskDataIntegrity(),
    ),
  );

  protected readonly riskLevelLabel = computed(() => {
    const level = this.riskLevel();
    return level.charAt(0).toUpperCase() + level.slice(1);
  });

  protected readonly riskSeverity = computed(() => {
    const level = this.riskLevel();
    if (level === 'high') return 'danger' as const;
    if (level === 'medium') return 'warn' as const;
    return 'success' as const;
  });

  // Populate form when system input changes
  private readonly patchFormEffect = effect(() => {
    const sys = this.system();
    const isVisible = this.visible();

    // Untrack form to avoid cycles if we add other dependencies
    untracked(() => {
      if (!isVisible) return;

      if (sys) {
        this.form.patchValue({
          name: sys.name,
          version: sys.version ?? '',
          location: sys.location ?? '',
          description: sys.description ?? '',
          categoryId: sys.categoryId ?? '',
          customCoding: sys.customCoding ?? '',
          lifecycleStatus: sys.lifecycleStatus,
          validationStatus: sys.validationStatus,
          riskPatientSafety: sys.riskPatientSafety,
          riskProductQuality: sys.riskProductQuality,
          riskDataIntegrity: sys.riskDataIntegrity,
          alcoaRelevant: sys.alcoaRelevant,
          lastReviewDate: sys.lastReviewDate ? new Date(sys.lastReviewDate) : null,
          nextReviewDate: sys.nextReviewDate ? new Date(sys.nextReviewDate) : null,
          reviewNotes: sys.reviewNotes ?? '',
        });
      } else {
        this.form.reset({
          lifecycleStatus: 'draft',
          validationStatus: 'not_validated',
          riskPatientSafety: false,
          riskProductQuality: false,
          riskDataIntegrity: false,
          alcoaRelevant: false,
        });
      }
    });
  });

  protected getCategoryById(id: string): CsvCategory | undefined {
    return this.categories().find((c) => c.id === id);
  }

  protected onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
  }

  protected cancel(): void {
    this.visibleChange.emit(false);
  }

  protected save(): void {
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const payload: Partial<ComputerizedSystem> = {
      name: val.name ?? '',
      version: val.version || null,
      location: val.location || null,
      description: val.description || null,
      categoryId: val.categoryId || null,
      customCoding: (val.customCoding as ComputerizedSystem['customCoding']) || null,
      lifecycleStatus: (val.lifecycleStatus as ComputerizedSystem['lifecycleStatus']) ?? 'draft',
      validationStatus:
        (val.validationStatus as ComputerizedSystem['validationStatus']) ?? 'not_validated',
      riskPatientSafety: val.riskPatientSafety ?? false,
      riskProductQuality: val.riskProductQuality ?? false,
      riskDataIntegrity: val.riskDataIntegrity ?? false,
      alcoaRelevant: val.alcoaRelevant ?? false,
      lastReviewDate: val.lastReviewDate ? val.lastReviewDate.toISOString().split('T')[0] : null,
      nextReviewDate: val.nextReviewDate ? val.nextReviewDate.toISOString().split('T')[0] : null,
      reviewNotes: val.reviewNotes || null,
    };

    this.saved.emit(payload);
  }
}
