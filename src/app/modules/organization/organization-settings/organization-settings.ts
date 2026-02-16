import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TextareaModule } from 'primeng/textarea';
import { FluidModule } from 'primeng/fluid';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    SelectModule,
    FluidModule,
    TextareaModule,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  template: `
    <div class="card p-4">
      <div class="flex flex-col gap-4 mb-6">
        <h2 class="text-2xl font-bold m-0">Organization Settings</h2>
        <p class="text-surface-500 m-0">
          Manage your organization's basic information and branding.
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Logo Section -->
          <div class="lg:col-span-1 flex flex-col items-center">
            <div class="relative group">
              <div
                class="w-48 h-48 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center overflow-hidden bg-surface-50 dark:bg-surface-900 group-hover:border-primary transition-colors"
                [style.background-image]="logoUrl() ? 'url(' + logoUrl() + ')' : 'none'"
                style="background-size: cover; background-position: center;"
              >
                @if (!logoUrl()) {
                  <div class="text-center p-4">
                    <i class="pi pi-image text-4xl text-surface-400 mb-2"></i>
                    <p class="text-sm text-surface-500">Logo preview</p>
                  </div>
                }
              </div>
              <button
                type="button"
                pButton
                icon="pi pi-camera"
                class="absolute bottom-2 right-2 p-button-rounded p-button-primary shadow-lg"
                (click)="fileInput.click()"
                aria-label="Upload logo"
              ></button>
              <input
                #fileInput
                type="file"
                (change)="onFileSelect($event)"
                accept="image/*"
                class="hidden"
              />
            </div>
            <p class="text-xs text-surface-400 mt-4 text-center">
              Recommended size: 512x512px.<br />Max size: 2MB (JPG, PNG, WebP)
            </p>
          </div>

          <!-- Basic Info Section -->
          <div class="lg:col-span-2">
            <p-fluid class="grid grid-cols-1 gap-4">
              <div class="field">
                <label for="name" class="block font-medium mb-1">Organization Name</label>
                <input
                  pInputText
                  id="name"
                  formControlName="name"
                  placeholder="Enter organization name"
                />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <small class="text-red-500 mt-1 block">Organization name is required.</small>
                }
              </div>

              <div class="field">
                <label for="country" class="block font-medium mb-1">Country</label>
                <p-select
                  id="country"
                  formControlName="country"
                  [options]="countries"
                  optionLabel="name"
                  optionValue="code"
                  placeholder="Select a country"
                  [filter]="true"
                  filterBy="name"
                >
                  <ng-template pTemplate="selectedItem" let-selectedOption>
                    @if (selectedOption) {
                      <div class="flex items-center gap-2">
                        <span [class]="'fi fi-' + selectedOption.code.toLowerCase()"></span>
                        <div>{{ selectedOption.name }}</div>
                      </div>
                    }
                  </ng-template>
                  <ng-template pTemplate="item" let-country>
                    <div class="flex items-center gap-2">
                      <span [class]="'fi fi-' + country.code.toLowerCase()"></span>
                      <div>{{ country.name }}</div>
                    </div>
                  </ng-template>
                </p-select>
              </div>

              <div class="field">
                <label for="website" class="block font-medium mb-1">Website (Optional)</label>
                <div class="p-inputgroup">
                  <span class="p-inputgroup-addon">https://</span>
                  <input
                    pInputText
                    id="website"
                    formControlName="website"
                    placeholder="www.your-org.com"
                  />
                </div>
              </div>

              <div class="field">
                <label for="description" class="block font-medium mb-1">Description</label>
                <textarea
                  pTextarea
                  id="description"
                  formControlName="description"
                  rows="4"
                  placeholder="Tell us about your organization..."
                  [autoResize]="true"
                ></textarea>
              </div>
            </p-fluid>
          </div>
        </div>

        <div
          class="flex justify-end gap-2 pt-4 border-t border-surface-200 dark:border-surface-700"
        >
          <p-button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            [outlined]="true"
            type="button"
          />
          <p-button
            label="Save Changes"
            icon="pi pi-check"
            [loading]="saving()"
            type="submit"
            [disabled]="form.invalid"
          />
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSettings {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  logoUrl = signal<string | null>(null);
  saving = signal(false);

  countries = [
    { name: 'Colombia', code: 'CO' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Spain', code: 'ES' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Germany', code: 'DE' },
    { name: 'France', code: 'FR' },
    { name: 'Italy', code: 'IT' },
    { name: 'Canada', code: 'CA' },
    { name: 'Australia', code: 'AU' },
    { name: 'Japan', code: 'JP' },
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    country: [''],
    website: [''],
    description: [''],
  });

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.messageService.add({
          severity: 'error',
          summary: 'File too large',
          detail: 'Logo must be smaller than 2MB',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.logoUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);

    // Simulate API call
    setTimeout(() => {
      this.saving.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Organization settings updated successfully',
      });
    }, 1500);
  }
}
