import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, tap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { FluidModule } from 'primeng/fluid';
import { MessageService } from 'primeng/api';
import { UsersService } from '../users.service';
import { User, CreateUserRequest, UpdateUserRequest } from '../users.interface';
import { OrganizationService } from '../../../../auth/organization.service';
import { IamService } from '@/core/services/iam.service';
import { AppConfigService } from '@/config/app-config.service';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    CheckboxModule,
    FluidModule,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [header]="editMode() ? 'Edit User' : 'New User'"
      [style]="{ width: '30rem' }"
      [draggable]="false"
      [resizable]="false"
      (onHide)="onHide()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        <p-fluid>
          <!-- Email (Create Only) -->
          @if (!editMode()) {
            <div class="field">
              <label for="email" class="font-bold block mb-2">Email</label>
              <input pInputText id="email" formControlName="email" placeholder="user@example.com" />
              @if (form.controls['email'].invalid && form.controls['email'].touched) {
                <small class="text-red-500 block mt-1"> Valid email is required. </small>
              }
            </div>

            @if (!existingUser()) {
              <div class="field">
                <label for="password" class="font-bold block mb-2">Password</label>
                <p-password
                  id="password"
                  formControlName="password"
                  [toggleMask]="true"
                  [feedback]="false"
                  placeholder="********"
                />
                @if (form.controls['password'].invalid && form.controls['password'].touched) {
                  <small class="text-red-500 block mt-1">
                    Password must be at least 8 characters.
                  </small>
                }
              </div>
            }
          }

          <!-- User Found Message -->
          @if (existingUser()) {
            <div
              class="p-4 bg-surface-100 dark:bg-surface-800 rounded mb-3 border border-surface-200 dark:border-surface-700"
            >
              <div class="flex items-center gap-3">
                <i class="pi pi-user-plus text-primary text-xl"></i>
                <div>
                  <div class="font-bold">User Found</div>
                  <div class="text-sm text-surface-600 dark:text-surface-400">
                    {{ existingUser()?.profile?.fullName }}
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Name Fields -->
          @if (!existingUser()) {
            <div class="field">
              <label for="firstName" class="font-bold block mb-2">First Name</label>
              <input pInputText id="firstName" formControlName="firstName" />
              @if (form.controls['firstName'].invalid && form.controls['firstName'].touched) {
                <small class="text-red-500 block mt-1">First name is required.</small>
              }
            </div>

            <div class="field">
              <label for="lastName" class="font-bold block mb-2">Last Name</label>
              <input pInputText id="lastName" formControlName="lastName" />
              @if (form.controls['lastName'].invalid && form.controls['lastName'].touched) {
                <small class="text-red-500 block mt-1">Last name is required.</small>
              }
            </div>
          }

          <!-- Display Name (Edit Only) -->
          @if (editMode()) {
            <div class="field">
              <label for="displayName" class="font-bold block mb-2">Display Name</label>
              <input pInputText id="displayName" formControlName="displayName" />
            </div>
          }
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
            [label]="existingUser() ? 'Grant Access' : 'Save'"
            [icon]="existingUser() ? 'pi pi-lock-open' : 'pi pi-check'"
            type="submit"
            [disabled]="form.invalid || saving()"
            [loading]="saving()"
          />
        </div>
      </form>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialog {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private messageService = inject(MessageService);
  private organizationService = inject(OrganizationService);
  private iamService = inject(IamService);
  private configService = inject(AppConfigService);

  visible = model<boolean>(false);
  user = model<User | null>(null);
  saved = output<void>(); // Emits when saved successfully

  editMode = signal(false);
  saving = signal(false);
  existingUser = signal<User | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    displayName: [''],
  });

  constructor() {
    // Determine existing user by email
    this.form.controls.email.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => this.existingUser.set(null)), // Reset when typing
        filter((email) => this.form.controls.email.valid && !!email && !this.editMode()),
        switchMap((email) => this.usersService.findUserByEmail(email!)),
        takeUntilDestroyed(),
      )
      .subscribe((user) => {
        this.existingUser.set(user);
        if (user) {
          // Clear validators for fields that are hidden
          this.form.controls.firstName.clearValidators();
          this.form.controls.lastName.clearValidators();
          this.form.controls.password.clearValidators();
        } else {
          // Restore validators
          this.form.controls.firstName.setValidators([Validators.required]);
          this.form.controls.lastName.setValidators([Validators.required]);
          this.form.controls.password.setValidators([Validators.minLength(8)]);
        }
        this.form.controls.firstName.updateValueAndValidity();
        this.form.controls.lastName.updateValueAndValidity();
        this.form.controls.password.updateValueAndValidity();
      });

    effect(() => {
      const u = this.user();
      if (u) {
        this.editMode.set(true);
        this.existingUser.set(null);
        this.form.patchValue({
          firstName: u.profile.firstName,
          lastName: u.profile.lastName,
          displayName: u.profile.displayName,
        });
        this.form.controls['email'].clearValidators();
        this.form.controls['password'].clearValidators();
      } else {
        this.editMode.set(false);
        this.existingUser.set(null);
        this.form.reset();
        this.form.controls['email'].setValidators([Validators.required, Validators.email]);
        this.form.controls['password'].setValidators([Validators.minLength(8)]);
        this.form.controls['firstName'].setValidators([Validators.required]);
        this.form.controls['lastName'].setValidators([Validators.required]);
      }
      this.form.controls['email'].updateValueAndValidity();
      this.form.controls['password'].updateValueAndValidity();
      this.form.controls['firstName'].updateValueAndValidity();
      this.form.controls['lastName'].updateValueAndValidity();
    });
  }

  onHide() {
    this.form.reset();
    this.user.set(null);
    this.existingUser.set(null);
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;
    const orgId = this.organizationService.activeOrganizationId();

    // Case 1: Grant Access to Existing User
    if (this.existingUser() && !this.editMode()) {
      const user = this.existingUser()!;
      if (!user.idpUserId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'User has no Identity Provider ID',
        });
        this.saving.set(false);
        return;
      }

      this.iamService
        .createAuthorization({
          userId: user.idpUserId,
          projectId: this.configService.idp().projectId,
          organizationId: orgId || '',
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Access granted successfully',
            });
            this.saving.set(false);
            this.saved.emit();
            this.visible.set(false);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to grant access',
            });
            this.saving.set(false);
          },
        });
      return;
    }

    // Case 2: Update Existing User
    if (this.editMode()) {
      const u = this.user();
      if (!u) return;

      const request: UpdateUserRequest = {
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        displayName: formValue.displayName || undefined,
      };

      this.usersService.updateUser(u.id, request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully',
          });
          this.saving.set(false);
          this.saved.emit(); // Trigger reload in parent
          this.visible.set(false);
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.detail?.message || 'Failed to update user',
          });
          this.saving.set(false);
        },
      });
    } else {
      // Case 3: Create New User

      const request: CreateUserRequest = {
        username: formValue.email!, // Username set to email per requirement
        email: formValue.email!,
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        password: formValue.password || undefined,
        organizationId: orgId,
      };

      this.usersService.createUser(request).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully',
          });
          this.saving.set(false);
          this.saved.emit(); // Trigger reload in parent
          this.visible.set(false);
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.detail?.message || 'Failed to create user',
          });
          this.saving.set(false);
        },
      });
    }
  }
}
