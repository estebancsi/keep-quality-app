import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { type Notification, type NotificationType } from '../models/notification.interface';

const TYPE_ICONS: Record<NotificationType, string> = {
  info: 'pi pi-info-circle text-blue-500',
  warning: 'pi pi-exclamation-triangle text-yellow-500',
  success: 'pi pi-check-circle text-green-500',
  error: 'pi pi-times-circle text-red-500',
};

@Component({
  selector: 'app-notification-item',
  imports: [BadgeModule, AvatarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="w-full flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-emphasis transition-all text-left"
      [class.opacity-60]="notification().is_read"
      (click)="read.emit(notification().id)"
    >
      <!-- Type icon -->
      <div class="shrink-0 mt-0.5">
        <i [class]="typeIcon()"></i>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <span class="label-small text-surface-950 dark:text-surface-0 line-clamp-1">
            {{ notification().title }}
          </span>
          @if (!notification().is_read) {
            <p-badge value="" severity="success" class="shrink-0 mt-0.5" />
          }
        </div>
        <p class="label-xsmall line-clamp-2 mt-0.5 text-start">{{ notification().message }}</p>
        <span class="label-xsmall text-surface-400 mt-1 block text-end">{{ relativeTime() }}</span>
      </div>
    </button>
  `,
})
export class NotificationItemComponent {
  readonly notification = input.required<Notification>();
  readonly read = output<string>();

  protected readonly typeIcon = () => TYPE_ICONS[this.notification().notification_type];

  protected relativeTime(): string {
    const now = Date.now();
    const then = new Date(this.notification().created_at).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return new Date(this.notification().created_at).toLocaleDateString();
  }
}
