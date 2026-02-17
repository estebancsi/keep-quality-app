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
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import {
  LifecycleProject,
  LifecycleProjectStatus,
  LIFECYCLE_PROJECT_STATUS_OPTIONS,
  LIFECYCLE_PROJECT_TRANSITIONS,
  LIFECYCLE_PROJECT_TYPE_OPTIONS,
} from '../../lifecycle-project.interface';

interface SystemOption {
  id: string;
  name: string;
  code: number;
}

@Component({
  selector: 'app-lifecycle-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    MessageModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [header]="dialogTitle()"
      [modal]="true"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [style]="{ width: '600px' }"
      [draggable]="false"
      [resizable]="false"
    >
      <form [formGroup]="form" class="flex flex-col gap-4 pt-2">
        <!-- System -->
        <div class="flex flex-col gap-1">
          <label for="systemId" class="font-semibold"
            >System <span class="text-red-500">*</span></label
          >
          <p-select
            id="systemId"
            formControlName="systemId"
            [options]="systems()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select a system"
            [filter]="true"
            filterBy="name"
            [disabled]="isEditing()"
            styleClass="w-full"
          >
            <ng-template #selectedItem let-selected>
              @if (selected) {
                <span>{{ selected.code }} — {{ selected.name }}</span>
              }
            </ng-template>
            <ng-template #item let-option>
              <span>{{ option.code }} — {{ option.name }}</span>
            </ng-template>
          </p-select>
        </div>

        <!-- Type -->
        <div class="flex flex-col gap-1">
          <label for="type" class="font-semibold">Type <span class="text-red-500">*</span></label>
          <p-select
            id="type"
            formControlName="type"
            [options]="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            [disabled]="isEditing()"
            styleClass="w-full"
          />
        </div>

        <!-- Status -->
        <div class="flex flex-col gap-1">
          <label for="status" class="font-semibold">Status</label>
          <p-select
            id="status"
            formControlName="status"
            [options]="availableStatuses()"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
          />
          @if (isEditing() && availableStatuses().length <= 1) {
            <p-message severity="info" text="No further transitions available from this status." />
          }
        </div>

        <!-- Dates row -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="startDate" class="font-semibold">Start Date</label>
            <p-datepicker
              id="startDate"
              formControlName="startDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label for="targetCompletionDate" class="font-semibold">Target Completion</label>
            <p-datepicker
              id="targetCompletionDate"
              formControlName="targetCompletionDate"
              dateFormat="yy-mm-dd"
              [showIcon]="true"
              styleClass="w-full"
            />
          </div>
        </div>

        <!-- Assigned To -->
        <div class="flex flex-col gap-1">
          <label for="assignedTo" class="font-semibold">Owner</label>
          <p-select
            id="assignedTo"
            formControlName="assignedTo"
            [options]="users()"
            optionLabel="displayName"
            optionValue="id"
            placeholder="Select owner"
            [filter]="true"
            filterBy="displayName"
            [showClear]="true"
            styleClass="w-full"
          />
        </div>

        <!-- Notes -->
        <div class="flex flex-col gap-1">
          <label for="notes" class="font-semibold">Notes</label>
          <textarea pTextarea id="notes" formControlName="notes" rows="3" class="w-full"></textarea>
        </div>

        <!-- Attachments placeholder -->
        <div class="flex flex-col gap-1">
          <label class="font-semibold text-surface-400">Attachments</label>
          <div
            class="border border-dashed border-surface-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-surface-400"
          >
            <i class="pi pi-cloud-upload text-2xl"></i>
            <span class="text-sm">Coming soon</span>
          </div>
        </div>
      </form>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button label="Cancel" severity="secondary" [outlined]="true" (click)="cancel()" />
          <p-button
            [label]="isEditing() ? 'Update' : 'Create'"
            icon="pi pi-check"
            (click)="save()"
            [disabled]="form.invalid"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class LifecycleFormDialog {
  private readonly fb = inject(FormBuilder);

  // Inputs / Outputs
  readonly visible = input(false);
  readonly project = input<Partial<LifecycleProject> | null>(null);
  readonly systems = input<SystemOption[]>([]);
  readonly users = input<{ id: string; displayName: string }[]>([]);

  readonly visibleChange = output<boolean>();
  readonly saved = output<Partial<LifecycleProject>>();

  // Constants
  protected readonly typeOptions = LIFECYCLE_PROJECT_TYPE_OPTIONS;

  // Computed
  protected readonly isEditing = computed(() => !!this.project()?.id);

  protected readonly dialogTitle = computed(() =>
    this.isEditing() ? 'Edit Lifecycle Project' : 'New Lifecycle Project',
  );

  protected readonly availableStatuses = computed(() => {
    const current = this.project()?.status ?? 'draft';
    const allowed = LIFECYCLE_PROJECT_TRANSITIONS[current] ?? [];
    // Include current status + allowed transitions
    const values = [current, ...allowed];
    return LIFECYCLE_PROJECT_STATUS_OPTIONS.filter((o) => values.includes(o.value));
  });

  // Form
  readonly form = this.fb.group({
    systemId: ['', Validators.required],
    type: ['', Validators.required],
    status: ['draft' as LifecycleProjectStatus],
    startDate: [null as Date | null],
    targetCompletionDate: [null as Date | null],
    assignedTo: [null as string | null],
    notes: [''],
  });

  // Sync form when project input changes
  private readonly syncEffect = effect(() => {
    const p = this.project();
    untracked(() => {
      if (p?.id) {
        // Edit mode (p is full LifecycleProject)
        this.form.patchValue({
          systemId: p.systemId,
          type: p.type,
          status: p.status,
          startDate: p.startDate ? new Date(p.startDate) : null,
          targetCompletionDate: p.targetCompletionDate ? new Date(p.targetCompletionDate) : null,
          assignedTo: p.assignedTo,
          notes: p.notes ?? '',
        });
      } else {
        // Create mode (p might be partial for pre-fill)
        this.form.reset({
          systemId: '',
          type: '',
          status: 'draft',
          startDate: null,
          targetCompletionDate: null,
          assignedTo: null,
          notes: '',
        });
        if (p) {
          this.form.patchValue(p as any);
        }
      }
    });
  });

  // Methods
  protected onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
  }

  protected cancel(): void {
    this.visibleChange.emit(false);
  }

  protected save(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    const payload: Partial<LifecycleProject> = {
      systemId: v.systemId ?? undefined,
      type: (v.type as LifecycleProject['type']) ?? undefined,
      status: v.status ?? undefined,
      startDate: v.startDate ? this.formatDate(v.startDate) : null,
      targetCompletionDate: v.targetCompletionDate ? this.formatDate(v.targetCompletionDate) : null,
      assignedTo: v.assignedTo ?? null,
      notes: v.notes || null,
    };

    this.saved.emit(payload);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
