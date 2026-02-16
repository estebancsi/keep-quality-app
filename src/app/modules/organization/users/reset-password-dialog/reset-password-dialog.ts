import { ChangeDetectionStrategy, Component, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { FluidModule } from 'primeng/fluid';
import { MessageService } from 'primeng/api';
import { UsersService } from '../users.service';
import { ResetPasswordRequest } from '../users.interface';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    PasswordModule,
    CheckboxModule,
    FluidModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      header="Reset Password"
      [style]="{ width: '25rem' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onHide()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <p class="text-surface-500 m-0 mb-2">Enter a new password for the user.</p>

        <p-fluid>
          <div class="field">
            <label for="newPassword" class="font-bold block mb-2">New Password</label>
            <p-password
              id="newPassword"
              formControlName="newPassword"
              [toggleMask]="true"
              [feedback]="true"
              placeholder="********"
            />
            @if (form.controls['newPassword'].invalid && form.controls['newPassword'].touched) {
              <small class="text-red-500 block mt-1">
                Password must be at least 8 characters.
              </small>
            }
          </div>

          <div class="field-checkbox flex items-center gap-2">
            <p-checkbox id="requireChange" formControlName="requireChange" [binary]="true" />
            <label for="requireChange">Require password change on next login</label>
          </div>
        </p-fluid>

        <div class="flex justify-end gap-2 mt-4">
          <p-button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            [text]="true"
            (onClick)="visible.set(false)"
          />
          <p-button
            label="Reset Password"
            icon="pi pi-key"
            type="submit"
            severity="warn"
            [disabled]="form.invalid || saving()"
            [loading]="saving()"
          />
        </div>
      </form>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordDialog {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);

  visible = model<boolean>(false);
  userId = model<string | null>(null);

  saving = signal(false);

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    requireChange: [false],
  });

  onHide() {
    this.form.reset({ requireChange: false });
    this.userId.set(null);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const uid = this.userId();
    if (!uid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const request: ResetPasswordRequest = {
      newPassword: formValue.newPassword!,
      requirePasswordChange: formValue.requireChange || false,
    };

    this.usersService.resetPassword(uid, request).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password reset successfully',
        });
        this.saving.set(false);
        this.visible.set(false);
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.detail?.message || 'Failed to reset password',
        });
        this.saving.set(false);
      },
    });
  }
}
