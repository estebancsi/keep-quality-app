import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { NotificationService } from '@/modules/notifications/services/notification.service';
import { AppConfigService } from '@/config/app-config.service';
import { OrganizationService } from '@/auth/organization.service';
import { IamService } from '@/core/services/iam.service';
import type {
  AudienceType,
  NotificationType,
} from '@/modules/notifications/models/notification.interface';
import type { AuthorizationResponse } from '@/core/services/iam.interface';
import { firstValueFrom } from 'rxjs';

interface SelectOption {
  label: string;
  value: string;
}

const NOTIFICATION_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Success', value: 'success' },
  { label: 'Error', value: 'error' },
];

const AUDIENCE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'User', value: 'user' },
  { label: 'Project', value: 'project' },
  { label: 'Organization', value: 'organization' },
];

@Component({
  selector: 'app-send-notification-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast />

    <div class="flex flex-col gap-6 max-w-2xl mx-auto py-8 px-4">
      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-semibold text-surface-950 dark:text-surface-0">
          Send Notification
        </h1>
        <p class="text-surface-500 mt-1 text-sm">
          Create and dispatch a notification to a user, project, or organization.
        </p>
      </div>

      <!-- Form card -->
      <div class="rounded-2xl border border-surface bg-surface-0 dark:bg-surface-900 p-6 shadow-sm">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="flex flex-col gap-5">
          <!-- Title -->
          <div class="flex flex-col gap-1.5">
            <label for="notif-title" class="label-small text-surface-950 dark:text-surface-0">
              Title <span aria-hidden="true" class="text-red-500">*</span>
            </label>
            <input
              id="notif-title"
              pInputText
              type="text"
              formControlName="title"
              placeholder="Notification title"
              maxlength="255"
              [class.ng-invalid]="submitted() && form.controls.title.invalid"
              aria-required="true"
            />
            @if (submitted() && form.controls.title.hasError('required')) {
              <span class="text-red-500 text-xs" role="alert">Title is required.</span>
            }
            @if (submitted() && form.controls.title.hasError('maxlength')) {
              <span class="text-red-500 text-xs" role="alert"
                >Title cannot exceed 255 characters.</span
              >
            }
          </div>

          <!-- Message -->
          <div class="flex flex-col gap-1.5">
            <label for="notif-message" class="label-small text-surface-950 dark:text-surface-0">
              Message <span aria-hidden="true" class="text-red-500">*</span>
            </label>
            <textarea
              id="notif-message"
              pTextarea
              formControlName="message"
              placeholder="Notification message body"
              rows="4"
              [class.ng-invalid]="submitted() && form.controls.message.invalid"
              aria-required="true"
            ></textarea>
            @if (submitted() && form.controls.message.hasError('required')) {
              <span class="text-red-500 text-xs" role="alert">Message is required.</span>
            }
          </div>

          <!-- Type + Audience row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <!-- Notification type -->
            <div class="flex flex-col gap-1.5">
              <label for="notif-type" class="label-small text-surface-950 dark:text-surface-0">
                Type <span aria-hidden="true" class="text-red-500">*</span>
              </label>
              <p-select
                inputId="notif-type"
                formControlName="notification_type"
                [options]="notificationTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select type"
                appendTo="body"
                styleClass="w-full"
              />
            </div>

            <!-- Audience type -->
            <div class="flex flex-col gap-1.5">
              <label
                for="notif-audience-type"
                class="label-small text-surface-950 dark:text-surface-0"
              >
                Audience <span aria-hidden="true" class="text-red-500">*</span>
              </label>
              <p-select
                inputId="notif-audience-type"
                formControlName="audience_type"
                [options]="audienceTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select audience"
                appendTo="body"
                styleClass="w-full"
              />
            </div>
          </div>

          <!-- Audience ID — dynamic -->
          <div class="flex flex-col gap-1.5">
            <label for="notif-audience-id" class="label-small text-surface-950 dark:text-surface-0">
              Audience ID
              @if (audienceTypeValue() === 'user') {
                <span aria-hidden="true" class="text-red-500">*</span>
              }
            </label>

            @if (autoFilledAudienceId() === null) {
              <!-- User picker -->
              @if (loadingUsers()) {
                <div class="flex items-center gap-2 text-surface-400 text-sm py-2">
                  <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                  Loading users…
                </div>
              } @else {
                <p-select
                  inputId="notif-audience-id"
                  formControlName="audience_id"
                  [options]="userOptions()"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select a user"
                  [filter]="true"
                  filterBy="label"
                  [class.ng-invalid]="submitted() && form.controls.audience_id.invalid"
                  aria-required="true"
                  appendTo="body"
                  styleClass="w-full"
                />
                @if (submitted() && form.controls.audience_id.hasError('required')) {
                  <span class="text-red-500 text-xs" role="alert">Please select a user.</span>
                }
              }
            } @else {
              <!-- Auto-filled — locked by form control disable() -->
              <input
                id="notif-audience-id"
                pInputText
                type="text"
                [value]="autoFilledAudienceId()"
                class="w-full opacity-70 cursor-not-allowed"
                [disabled]="true"
                aria-readonly="true"
              />
              <span class="text-surface-400 text-xs">
                Auto-filled from current
                {{ audienceTypeValue() === 'project' ? 'project' : 'organization' }}. Cannot be
                changed.
              </span>
            }
          </div>

          <!-- Action URL (optional) -->
          <div class="flex flex-col gap-1.5">
            <label for="notif-action-url" class="label-small text-surface-950 dark:text-surface-0">
              Action URL <span class="text-surface-400 text-xs font-normal">(optional)</span>
            </label>
            <input
              id="notif-action-url"
              pInputText
              type="text"
              formControlName="action_url"
              placeholder="e.g. /csv/123 or https://…"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2 border-t border-surface">
            <p-button
              type="button"
              label="Reset"
              severity="secondary"
              [text]="true"
              (click)="resetForm()"
              [disabled]="submitting()"
            />
            <p-button
              type="submit"
              label="Send Notification"
              icon="pi pi-send"
              [loading]="submitting()"
            />
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SendNotificationPage {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly configService = inject(AppConfigService);
  private readonly orgService = inject(OrganizationService);
  private readonly iamService = inject(IamService);
  private readonly messageService = inject(MessageService);

  protected readonly notificationTypeOptions = NOTIFICATION_TYPE_OPTIONS;
  protected readonly audienceTypeOptions = AUDIENCE_TYPE_OPTIONS;

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly loadingUsers = signal(false);
  private readonly _users = signal<AuthorizationResponse[]>([]);

  protected readonly userOptions = computed<SelectOption[]>(() => {
    const seen = new Set<string>();
    return this._users()
      .filter((auth) => {
        if (seen.has(auth.user.id)) return false;
        seen.add(auth.user.id);
        return true;
      })
      .map((auth) => ({
        label: auth.user.displayName || auth.user.preferredLoginName || auth.user.id,
        value: auth.user.id,
      }));
  });

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    message: ['', [Validators.required]],
    notification_type: ['info' as NotificationType, [Validators.required]],
    audience_type: ['user' as AudienceType, [Validators.required]],
    audience_id: [''],

    action_url: [''],
  });

  // toSignal converts the form control valueChanges Observable into a real Angular signal
  // so computed() and template bindings reactively update when audience_type changes.
  protected readonly audienceTypeValue = toSignal(this.form.controls.audience_type.valueChanges, {
    initialValue: 'user' as AudienceType,
  });

  // Derived signals for the auto-filled audience ID values
  protected readonly projectId = computed(() => this.configService.idp().projectId ?? '');
  protected readonly orgId = computed(() => this.orgService.activeOrganizationId() ?? '');

  protected readonly autoFilledAudienceId = computed(() => {
    const type = this.audienceTypeValue();
    if (type === 'project') return this.projectId();
    if (type === 'organization') return this.orgId();
    return null; // null means: show the user picker
  });

  constructor() {
    // React to audience_type changes using valueChanges subscription
    // (effect() cannot be used here because form control values are not signals)
    this.form.controls.audience_type.valueChanges.pipe(takeUntilDestroyed()).subscribe((type) => {
      const audienceIdCtrl = this.form.controls.audience_id;

      if (type === 'project') {
        audienceIdCtrl.clearValidators();
        audienceIdCtrl.setValue(this.configService.idp().projectId ?? '');
        audienceIdCtrl.disable({ emitEvent: false });
      } else if (type === 'organization') {
        audienceIdCtrl.clearValidators();
        audienceIdCtrl.setValue(this.orgService.activeOrganizationId() ?? '');
        audienceIdCtrl.disable({ emitEvent: false });
      } else {
        // user — enable picker and make required
        audienceIdCtrl.setValidators([Validators.required]);
        audienceIdCtrl.enable({ emitEvent: false });
        audienceIdCtrl.setValue('');
        if (this._users().length === 0) {
          void this.loadUsers();
        }
      }
      audienceIdCtrl.updateValueAndValidity();
    });

    // Eagerly load users since 'user' is the default audience type
    void this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    this.loadingUsers.set(true);
    try {
      const projectId = this.configService.idp().projectId;
      const organizationId = this.orgService.activeOrganizationId() ?? undefined;
      const users = await firstValueFrom(
        this.iamService.getAuthorizations({ projectId, organizationId }),
      );
      this._users.set(users);
    } catch {
      this.messageService.add({
        severity: 'warn',
        summary: 'Users unavailable',
        detail: 'Could not load user list. You may enter the user ID manually.',
      });
    } finally {
      this.loadingUsers.set(false);
    }
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.submitting.set(true);
    try {
      const { title, message, notification_type, audience_type, audience_id, action_url } =
        this.form.getRawValue();

      await this.notificationService.createNotification({
        title,
        message,
        notification_type: notification_type as NotificationType,
        audience_type: audience_type as AudienceType,
        audience_id,
        action_url: action_url || null,
        project_id: this.configService.idp().projectId,
      });

      this.messageService.add({
        severity: 'success',
        summary: 'Notification sent',
        detail: `"${title}" was dispatched successfully.`,
      });
      this.resetForm();
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Send failed',
        detail: 'An error occurred while sending the notification. Please try again.',
      });
    } finally {
      this.submitting.set(false);
    }
  }

  protected resetForm(): void {
    this.submitted.set(false);
    this.form.reset({
      title: '',
      message: '',
      notification_type: 'info',
      audience_type: 'user',
      audience_id: '',
      action_url: '',
    });
  }
}
