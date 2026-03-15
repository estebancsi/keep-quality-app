import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SystemImpactTemplateService } from '../services/system-impact-template.service';
import { SystemImpactQuestion } from '../system-impact.interface';

interface EditableQuestion extends SystemImpactQuestion {
  /** true when this row is being edited inline */
  editing: boolean;
  /** draft text while editing */
  draftText: string;
}

@Component({
  selector: 'app-system-impact-template',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    TableModule,
    TooltipModule,
    TagModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <p-button
          icon="pi pi-arrow-left"
          [rounded]="true"
          [text]="true"
          severity="secondary"
          (click)="goBack()"
          pTooltip="Back to Computerized Systems"
          aria-label="Back to Computerized Systems"
        />
        <div class="flex-1">
          <h2 class="text-2xl font-bold m-0">System Impact Questionnaire Template</h2>
          <p class="text-surface-500 mt-1 mb-0 text-sm">
            Define the standard questions used when initializing a System Impact Determination for any
            lifecycle project. Changes here do <strong>not</strong> affect already-initialized
            projects.
          </p>
        </div>
        <p-button
          label="Save Template"
          icon="pi pi-save"
          [loading]="saving()"
          [disabled]="questions().length === 0"
          (click)="saveTemplate()"
          aria-label="Save template questions"
        />
      </div>

      <!-- Questions table -->
      <p-table
        [value]="questions()"
        [reorderableColumns]="false"
        dataKey="code"
        styleClass="p-datatable-sm"
        aria-label="System Impact questionnaire questions"
      >
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem" scope="col" aria-label="Row number">#</th>
            <th scope="col">Code</th>
            <th scope="col">Question Text</th>
            <th style="width: 8rem" scope="col">Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-q let-i="rowIndex">
          <tr>
            <td class="text-surface-400 text-sm">{{ i + 1 }}</td>

            <!-- Code -->
            <td>
              <p-tag [value]="q.code" severity="secondary" />
            </td>

            <!-- Text — read view / edit view -->
            <td>
              @if (q.editing) {
                <input
                  pInputText
                  class="w-full"
                  [(ngModel)]="q.draftText"
                  [attr.aria-label]="'Edit text for question ' + q.code"
                  (keydown.enter)="confirmEdit(q)"
                  (keydown.escape)="cancelEdit(q)"
                />
              } @else {
                <span>{{ q.text }}</span>
              }
            </td>

            <!-- Actions -->
            <td>
              <div class="flex gap-1">
                @if (q.editing) {
                  <p-button
                    icon="pi pi-check"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="success"
                    (click)="confirmEdit(q)"
                    pTooltip="Confirm"
                    [attr.aria-label]="'Confirm editing question ' + q.code"
                  />
                  <p-button
                    icon="pi pi-times"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="secondary"
                    (click)="cancelEdit(q)"
                    pTooltip="Cancel"
                    [attr.aria-label]="'Cancel editing question ' + q.code"
                  />
                } @else {
                  <p-button
                    icon="pi pi-pencil"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="secondary"
                    (click)="startEdit(q)"
                    pTooltip="Edit question"
                    [attr.aria-label]="'Edit question ' + q.code"
                  />
                  <p-button
                    icon="pi pi-arrow-up"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="secondary"
                    [disabled]="i === 0"
                    (click)="moveUp(i)"
                    pTooltip="Move up"
                    [attr.aria-label]="'Move question ' + q.code + ' up'"
                  />
                  <p-button
                    icon="pi pi-arrow-down"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="secondary"
                    [disabled]="i === questions().length - 1"
                    (click)="moveDown(i)"
                    pTooltip="Move down"
                    [attr.aria-label]="'Move question ' + q.code + ' down'"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    severity="danger"
                    (click)="removeQuestion(i)"
                    pTooltip="Remove question"
                    [attr.aria-label]="'Remove question ' + q.code"
                  />
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="text-center py-8 text-surface-400">
              No questions yet. Add your first question below.
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Add new question row -->
      <div class="flex gap-3 items-end p-4 border rounded-lg border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
        <div class="flex flex-col gap-1 flex-1">
          <label [for]="newQuestionInputId" class="text-sm font-medium">New Question Text</label>
          <input
            [id]="newQuestionInputId"
            pInputText
            class="w-full"
            [(ngModel)]="newQuestionText"
            placeholder="e.g. Does the system directly impact product quality or patient safety?"
            (keydown.enter)="addQuestion()"
            aria-label="New question text"
          />
        </div>
        <p-button
          label="Add Question"
          icon="pi pi-plus"
          [disabled]="!newQuestionText().trim()"
          (click)="addQuestion()"
          aria-label="Add new question"
        />
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <i class="pi pi-spin pi-spinner text-3xl text-surface-400" aria-label="Loading template"></i>
        </div>
      }
    </div>
  `,
})
export class SystemImpactTemplateComponent implements OnInit {
  private readonly templateService = inject(SystemImpactTemplateService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly questions = signal<EditableQuestion[]>([]);
  protected readonly newQuestionText = signal('');
  protected readonly newQuestionInputId = 'new-question-text';

  private nextQuestionNumber = computed(() => this.questions().length + 1);

  ngOnInit(): void {
    this.templateService.getTemplate().subscribe({
      next: (template) => {
        if (template) {
          this.questions.set(
            template.questions.map((q) => ({ ...q, editing: false, draftText: q.text })),
          );
          this.loading.set(false);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  protected goBack(): void {
    this.router.navigate(['/csv']);
  }

  // ─── Question management ──────────────────────────────────

  protected addQuestion(): void {
    const text = this.newQuestionText().trim();
    if (!text) return;

    const existingCodes = new Set(this.questions().map((q) => q.code));
    let n = this.questions().length + 1;
    let code = `Q${n}`;
    while (existingCodes.has(code)) {
      n++;
      code = `Q${n}`;
    }

    this.questions.update((prev) => [
      ...prev,
      { code, text, position: prev.length + 1, editing: false, draftText: text },
    ]);
    this.newQuestionText.set('');
  }

  protected removeQuestion(index: number): void {
    this.questions.update((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Re-number positions
      return next.map((q, i) => ({ ...q, position: i + 1 }));
    });
  }

  protected startEdit(q: EditableQuestion): void {
    this.questions.update((prev) =>
      prev.map((item) =>
        item.code === q.code ? { ...item, editing: true, draftText: item.text } : item,
      ),
    );
  }

  protected confirmEdit(q: EditableQuestion): void {
    const text = q.draftText.trim();
    if (!text) return;
    this.questions.update((prev) =>
      prev.map((item) =>
        item.code === q.code ? { ...item, text, editing: false } : item,
      ),
    );
  }

  protected cancelEdit(q: EditableQuestion): void {
    this.questions.update((prev) =>
      prev.map((item) =>
        item.code === q.code ? { ...item, editing: false, draftText: item.text } : item,
      ),
    );
  }

  protected moveUp(index: number): void {
    if (index === 0) return;
    this.questions.update((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((q, i) => ({ ...q, position: i + 1 }));
    });
  }

  protected moveDown(index: number): void {
    this.questions.update((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((q, i) => ({ ...q, position: i + 1 }));
    });
  }

  // ─── Persistence ─────────────────────────────────────────

  protected saveTemplate(): void {
    if (this.saving()) return;

    // Strip UI-only fields before saving
    const sanitized = this.questions().map(({ code, text, position }) => ({
      code,
      text,
      position,
    }));

    this.saving.set(true);
    this.templateService.upsertTemplate(sanitized).subscribe({
      next: () => this.saving.set(false),
      error: () => this.saving.set(false),
    });
  }
}
