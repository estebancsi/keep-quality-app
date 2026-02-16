import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '../../../auth/organization.service';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div
      class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950 px-4 py-8"
    >
      <div class="w-full max-w-md bg-white dark:bg-surface-900 rounded-xl shadow-lg p-8">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
            Create Account
          </h1>
          <p class="text-surface-600 dark:text-surface-400">
            Register your organization and admin account
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
          <!-- Organization Section -->
          <div class="flex flex-col gap-4">
            <h2
              class="text-lg font-semibold text-surface-800 dark:text-surface-100 border-b border-surface-200 dark:border-surface-700 pb-2"
            >
              Organization
            </h2>

            <div class="flex flex-col gap-2">
              <label for="orgName" class="font-medium text-surface-700 dark:text-surface-300"
                >Organization Name</label
              >
              <input
                pInputText
                id="orgName"
                formControlName="orgName"
                placeholder="Acme Inc."
                class="w-full"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="country" class="font-medium text-surface-700 dark:text-surface-300"
                >Country</label
              >
              <p-select
                [options]="countries"
                formControlName="country"
                optionLabel="name"
                optionValue="code"
                placeholder="Select Country"
                styleClass="w-full"
                [filter]="true"
                filterBy="name"
              >
              </p-select>
            </div>

            <div class="flex flex-col gap-2">
              <label for="purpose" class="font-medium text-surface-700 dark:text-surface-300"
                >Purpose</label
              >
              <p-select
                [options]="purposes"
                formControlName="purpose"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Purpose"
                styleClass="w-full"
              >
              </p-select>
            </div>

            <div class="flex flex-col gap-2">
              <label for="website" class="font-medium text-surface-700 dark:text-surface-300"
                >Website (Optional)</label
              >
              <input
                pInputText
                id="website"
                formControlName="website"
                placeholder="https://acme.com"
                class="w-full"
              />
            </div>
          </div>

          <!-- User Section -->
          <div class="flex flex-col gap-4">
            <h2
              class="text-lg font-semibold text-surface-800 dark:text-surface-100 border-b border-surface-200 dark:border-surface-700 pb-2"
            >
              Admin User
            </h2>

            <div class="flex flex-col gap-2">
              <label for="firstName" class="font-medium text-surface-700 dark:text-surface-300"
                >First Name</label
              >
              <input pInputText id="firstName" formControlName="firstName" class="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="lastName" class="font-medium text-surface-700 dark:text-surface-300"
                >Last Name</label
              >
              <input pInputText id="lastName" formControlName="lastName" class="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="email" class="font-medium text-surface-700 dark:text-surface-300"
                >Email</label
              >
              <input
                pInputText
                id="email"
                formControlName="email"
                type="email"
                placeholder="admin@acme.com"
                class="w-full"
              />
              <small class="text-surface-500">Also used as your username</small>
            </div>

            <div class="flex flex-col gap-2">
              <label for="password" class="font-medium text-surface-700 dark:text-surface-300"
                >Password</label
              >
              <p-password
                id="password"
                formControlName="password"
                [toggleMask]="true"
                styleClass="w-full"
                [inputStyle]="{ width: '100%' }"
                placeholder="••••••••"
              >
              </p-password>
            </div>
          </div>

          <p-button
            label="Create Account"
            type="submit"
            [loading]="loading()"
            [disabled]="form.invalid"
            styleClass="w-full"
          >
          </p-button>
        </form>
      </div>
      <p-toast></p-toast>
    </div>
  `,
})
export class RegistrationComponent {
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  loading = signal(false);

  form = this.fb.group({
    orgName: ['', Validators.required],
    country: ['', Validators.required],
    purpose: ['', Validators.required],
    website: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  countries = [
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'United Kingdom', code: 'UK' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Germany', code: 'DE' },
    { name: 'Japan', code: 'JP' },
  ];

  purposes = [
    { label: 'Professional', value: 'professional' },
    { label: 'Education', value: 'education' },
    { label: 'Personal', value: 'personal' },
    { label: 'Other', value: 'other' },
  ];

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    const val = this.form.value;

    const payload = {
      organization: {
        name: val.orgName!,
        country: val.country!,
        purpose: val.purpose!,
        website: val.website || undefined,
      },
      user: {
        email: val.email!,
        password: val.password!,
        firstName: val.firstName!,
        lastName: val.lastName!,
      },
    };

    this.orgService.register(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Organization created successfully. Redirecting...',
        });

        // Assume response contains orgId if successful, or we just trust the flow
        if (res && res.data && res.data.organizationId) {
          setTimeout(() => {
            this.orgService.switchOrganization(res.data.organizationId);
          }, 1500);
        } else {
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);
        }
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Registration failed. Please try again.',
        });
        this.loading.set(false);
      },
    });
  }
}
