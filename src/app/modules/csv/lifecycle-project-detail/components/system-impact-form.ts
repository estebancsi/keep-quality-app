import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SystemImpactArtifact, SystemImpactAnswer } from '../../system-impact.interface';
import { SystemImpactService } from '../../services/system-impact.service';
import { SystemImpactTemplateService } from '../../services/system-impact-template.service';

const ANSWER_OPTIONS = [
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

@Component({
  selector: 'app-system-impact-form',
  imports: [
    FormsModule,
    ButtonModule,
    SelectButtonModule,
    TextareaModule,
    DividerModule,
    TagModule,
    ConfirmDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <!-- Toolbar -->
      <div class="flex justify-between items-center mt-4">
        <div>
          <h3 class="text-lg font-semibold m-0">System Impact Determination</h3>
          <p class="text-surface-500 text-sm mt-1 mb-0">
            Answer each question to determine the GxP impact of this system.
            <button
              type="button"
              class="text-primary hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
              (click)="confirmReloadSnapshot()"
              [disabled]="reloading()"
            >
              Click here to reload the template
            </button>
            if questions have changed organization-wide.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <p-button
            icon="pi pi-pencil"
            label="Edit PDF"
            [outlined]="true"
            size="small"
            pTooltip="Edit"
            (click)="editPdf.emit()"
            aria-label="Edit PDF Template"
          />
          <p-button
            icon="pi pi-file-pdf"
            label="Generate PDF"
            [outlined]="true"
            size="small"
            pTooltip="Generate PDF"
            [loading]="generatingPdf()"
            (click)="generatePdf.emit()"
            aria-label="Generate System Impact PDF"
          />
          <p-button
            label="Save Answers"
            icon="pi pi-save"
            size="small"
            [loading]="saving()"
            (click)="saveAnswers()"
            aria-label="Save System Impact answers"
          />
        </div>
      </div>

      <p-divider />

      <!-- GxP Impact Verdict Banner -->
      <div
        class="flex items-center gap-3 p-4 rounded-xl border-2 transition-colors"
        [class]="verdictBannerClass()"
        role="status"
        [attr.aria-label]="'GxP Impact verdict: ' + verdictLabel()"
      >
        <i class="text-2xl" [class]="verdictIconClass()" aria-hidden="true"></i>
        <div class="flex flex-col gap-0.5 flex-1">
          <span class="text-xs font-semibold uppercase tracking-wide opacity-70">
            GxP Impact Determination
          </span>
          <span class="font-bold text-lg leading-tight">{{ verdictLabel() }}</span>
          <span class="text-sm opacity-75">{{ verdictDescription() }}</span>
        </div>
        <p-tag
          [value]="verdictTagLabel()"
          [severity]="verdictTagSeverity()"
          class="text-base px-3 py-1"
        />
      </div>

      <!-- Questions list -->
      @for (q of artifact().questionsSnapshot; track q.code) {
        <div
          class="flex flex-col gap-3 p-4 rounded-lg border border-surface-200 dark:border-surface-700"
          [attr.aria-label]="'Question ' + q.code"
        >
          <div class="flex items-start gap-3">
            <p-tag [value]="q.code" severity="secondary" class="mt-0.5 shrink-0" />
            <p class="m-0 font-medium leading-snug">{{ q.text }}</p>
          </div>

          <div class="flex gap-4 pl-10">
            <!-- Yes / No toggle -->
            <div class="flex flex-col items-start gap-1">
              <label class="text-sm text-surface-500 w-20">Answer</label>
              <p-selectButton
                [options]="answerOptions"
                [ngModel]="getAnswer(q.code)"
                (ngModelChange)="setAnswer(q.code, $event)"
                optionLabel="label"
                optionValue="value"
                [attr.aria-label]="'Answer for question ' + q.code"
              />
            </div>

            <!-- Justification (always visible but optional) -->
            <div class="flex flex-col gap-1 w-full">
              <label [for]="'justification-' + q.code" class="text-sm text-surface-500">
                Justification
                <span class="text-surface-400 font-normal">(optional)</span>
              </label>
              <textarea
                pTextarea
                [id]="'justification-' + q.code"
                class="w-full"
                rows="1"
                [ngModel]="getJustification(q.code)"
                (ngModelChange)="setJustification(q.code, $event)"
                placeholder="Add context or rationale…"
                [attr.aria-label]="'Justification for question ' + q.code"
              ></textarea>
            </div>
          </div>
        </div>
      }

      @if (artifact().questionsSnapshot.length === 0) {
        <div class="flex flex-col items-center gap-3 py-12">
          <i class="pi pi-info-circle text-4xl text-surface-400" aria-hidden="true"></i>
          <p class="text-surface-500 m-0">No questions found in this artifact snapshot.</p>
        </div>
      }

      <!-- Confirmation Dialog -->
      <p-confirmDialog [style]="{ width: '450px' }" />
    </div>
  `,
  providers: [ConfirmationService],
})
export class SystemImpactFormComponent implements OnInit {
  private readonly systemImpactService = inject(SystemImpactService);
  private readonly systemImpactTemplateService = inject(SystemImpactTemplateService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly artifact = input.required<SystemImpactArtifact>();

  /** Emits the updated artifact after a successful save */
  readonly saved = output<SystemImpactArtifact>();

  readonly generatingPdf = input(false);
  readonly editPdf = output<void>();
  readonly generatePdf = output<void>();

  protected readonly saving = signal(false);
  protected readonly reloading = signal(false);

  /** Working copy of the answers */
  protected readonly answers = signal<Record<string, SystemImpactAnswer>>({});

  protected readonly answerOptions = ANSWER_OPTIONS;

  ngOnInit(): void {
    this.answers.set({ ...this.artifact().answers });
  }

  // ─── GxP Impact verdict (derived from working answers) ────

  /**
   * Live-computed GxP impact from the *working copy* of answers
   * (before the user saves, so the badge updates in real-time).
   *   true  → any answer is Yes
   *   false → at least one answer exists and all are No
   *   null  → no answers yet
   */
  protected readonly gxpImpact = computed<boolean | null>(() => {
    const answered = Object.values(this.answers()).filter((a) => a.answer !== null);
    if (answered.length === 0) return null;
    return answered.some((a) => a.answer === true);
  });

  protected readonly verdictLabel = computed(() => {
    const v = this.gxpImpact();
    if (v === null) return 'Pending — answer questions to determine impact';
    return v ? 'GxP Impact Confirmed' : 'No GxP Impact';
  });

  protected readonly verdictDescription = computed(() => {
    const v = this.gxpImpact();
    if (v === null) return 'At least one Yes answer will trigger GxP impact.';
    return v
      ? 'At least one question was answered Yes. This system is subject to GxP requirements.'
      : 'All questions answered No. This system does not require GxP validation.';
  });

  protected readonly verdictTagLabel = computed(() => {
    const v = this.gxpImpact();
    if (v === null) return 'Pending';
    return v ? 'YES — GxP Impact' : 'NO GxP Impact';
  });

  protected readonly verdictTagSeverity = computed<'success' | 'info' | 'secondary'>(() => {
    const v = this.gxpImpact();
    if (v === null) return 'secondary';
    return v ? 'success' : 'info';
  });

  protected readonly verdictBannerClass = computed(() => {
    const v = this.gxpImpact();
    if (v === null)
      return 'border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-200';
    return v
      ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100'
      : 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100';
  });

  protected readonly verdictIconClass = computed(() => {
    const v = this.gxpImpact();
    if (v === null) return 'pi pi-clock text-surface-400';
    return v ? 'pi pi-check-circle text-green-500' : 'pi pi-info-circle text-blue-500';
  });

  // ─── Answer helpers ───────────────────────────────────────

  protected getAnswer(code: string): boolean | null {
    return this.answers()[code]?.answer ?? null;
  }

  protected getJustification(code: string): string {
    return this.answers()[code]?.justification ?? '';
  }

  protected setAnswer(code: string, value: boolean | null): void {
    this.answers.update((prev) => ({
      ...prev,
      [code]: { ...prev[code], answer: value, justification: prev[code]?.justification ?? null },
    }));
  }

  protected setJustification(code: string, value: string): void {
    this.answers.update((prev) => ({
      ...prev,
      [code]: { ...prev[code], justification: value || null, answer: prev[code]?.answer ?? null },
    }));
  }

  // ─── Persistence ─────────────────────────────────────────

  protected saveAnswers(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.systemImpactService.updateAnswers(this.artifact().id, this.answers()).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.saved.emit(updated);
      },
      error: () => this.saving.set(false),
    });
  }

  protected confirmReloadSnapshot(): void {
    this.confirmationService.confirm({
      header: 'Reload Template?',
      message:
        'This will update the questions to the latest organization-wide template. Answers to matching questions will be preserved, but answers to removed questions will be lost. Do you want to continue?',
      acceptIcon: 'pi pi-refresh',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => this.reloadSnapshot(),
    });
  }

  private reloadSnapshot(): void {
    if (this.reloading()) return;
    this.reloading.set(true);

    this.systemImpactTemplateService.getTemplate().subscribe({
      next: (template) => {
        if (!template) {
          this.reloading.set(false);
          return; // No template exists
        }
        this.systemImpactService
          .reloadSnapshot(this.artifact().id, template.questions, this.answers())
          .subscribe({
            next: (updated) => {
              this.reloading.set(false);
              this.answers.set({ ...updated.answers });
              this.saved.emit(updated); // Propagate the reloaded DB state
            },
            error: () => this.reloading.set(false),
          });
      },
      error: () => this.reloading.set(false),
    });
  }
}
