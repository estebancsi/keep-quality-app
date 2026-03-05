import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { NotificationService } from '../services/notification.service';
import { NotificationItemComponent } from './notification-item';
import { type Notification } from '../models/notification.interface';

type TabId = 'inbox' | 'general' | 'archived';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'general', label: 'General' },
  { id: 'archived', label: 'Archived' },
];

@Component({
  selector: 'app-notification-panel',
  imports: [BadgeModule, ButtonModule, RippleModule, StyleClassModule, NotificationItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Bell trigger -->
    <li class="right-sidebar-item static sm:relative">
      <a
        id="notification-bell-button"
        class="right-sidebar-button relative z-50"
        pStyleClass="@next"
        enterFromClass="hidden"
        enterActiveClass="animate-scalein"
        leaveActiveClass="animate-fadeout"
        leaveToClass="hidden"
        [hideOnOutsideClick]="true"
        aria-label="Notifications"
        role="button"
        tabindex="0"
      >
        @if (notificationService.unreadCount() > 0) {
          <span
            class="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2.5"
            aria-hidden="true"
          ></span>
        }
        <i class="pi pi-bell" aria-hidden="true"></i>
      </a>

      <!-- Dropdown panel -->
      <div
        role="dialog"
        aria-label="Notifications panel"
        class="list-none m-0 rounded-2xl border border-surface absolute bg-surface-0 dark:bg-surface-900 overflow-hidden hidden origin-top min-w-72 sm:w-88 mt-2 z-50 top-auto shadow-[0px_56px_16px_0px_rgba(0,0,0,0.00),0px_36px_14px_0px_rgba(0,0,0,0.01),0px_20px_12px_0px_rgba(0,0,0,0.02),0px_9px_9px_0px_rgba(0,0,0,0.03),0px_2px_5px_0px_rgba(0,0,0,0.04)]"
        style="right: -100px"
      >
        <!-- Header -->
        <div class="p-4 flex items-center justify-between border-b border-surface">
          <span class="label-small text-surface-950 dark:text-surface-0 flex items-center gap-2">
            Notifications
            @if (notificationService.unreadCount() > 0) {
              <span class="text-xs font-semibold text-primary"
                >({{ notificationService.unreadCount() }} unread)</span
              >
            }
          </span>
          <button
            pRipple
            type="button"
            class="py-1 px-2 text-surface-950 dark:text-surface-0 label-x-small hover:bg-emphasis border border-surface rounded-lg shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05)] transition-all disabled:opacity-40"
            [disabled]="notificationService.unreadCount() === 0"
            (click)="markAllAsRead()"
          >
            Mark all as read
          </button>
        </div>

        <!-- Tabs -->
        <div
          class="flex items-center border-b border-surface"
          role="tablist"
          aria-label="Notification categories"
        >
          @for (tab of tabs; track tab.id) {
            <button
              type="button"
              role="tab"
              [id]="'notification-tab-' + tab.id"
              [attr.aria-selected]="selectedTab() === tab.id"
              [class.border-surface-950]="selectedTab() === tab.id"
              [class.dark:border-surface-0]="selectedTab() === tab.id"
              [class.border-transparent]="selectedTab() !== tab.id"
              class="px-3.5 py-2 inline-flex items-center border-b gap-2 transition-colors"
              (click)="selectedTab.set(tab.id)"
            >
              <span
                [class.text-surface-950]="selectedTab() === tab.id"
                [class.dark:text-surface-0]="selectedTab() === tab.id"
                class="label-small"
                >{{ tab.label }}</span
              >
              @if (tabBadge(tab.id); as badge) {
                <p-badge [value]="badge" severity="danger" size="small" class="rounded-md!" />
              }
            </button>
          }
        </div>

        <!-- Notification list -->
        <ul
          role="tabpanel"
          [attr.aria-labelledby]="'notification-tab-' + selectedTab()"
          class="flex flex-col divide-y divide-(--surface-border) max-h-80 overflow-auto"
        >
          @if (notificationService.loading()) {
            <li class="flex items-center justify-center py-8 text-surface-400">
              <i class="pi pi-spin pi-spinner mr-2" aria-hidden="true"></i>
              <span class="label-small">Loading…</span>
            </li>
          } @else if (currentTabNotifications().length === 0) {
            <li class="flex flex-col items-center justify-center py-8 gap-2 text-surface-400">
              <i class="pi pi-bell-slash text-2xl" aria-hidden="true"></i>
              <span class="label-small">No notifications</span>
            </li>
          } @else {
            @for (item of currentTabNotifications(); track item.id) {
              <li>
                <app-notification-item
                  [notification]="item"
                  (read)="onNotificationRead($event, item)"
                />
              </li>
            }
          }
        </ul>
      </div>
    </li>
  `,
})
export class NotificationPanelComponent {
  protected readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly tabs = TABS;
  protected readonly selectedTab = signal<TabId>('inbox');

  protected readonly currentTabNotifications = computed<Notification[]>(() => {
    switch (this.selectedTab()) {
      case 'inbox':
        return this.notificationService.inboxNotifications();
      case 'general':
        return this.notificationService.generalNotifications();
      case 'archived':
        return this.notificationService.archivedNotifications();
    }
  });

  constructor() {
    // Load once on init — plain call, NOT inside effect() to avoid infinite loops
    // (effect() tracks signal reads; loadNotifications reads/writes loading signal)
    void this.notificationService.loadNotifications();
  }

  protected tabBadge(id: TabId): string | null {
    let count = 0;
    if (id === 'inbox') count = this.notificationService.inboxUnreadCount();
    if (id === 'general') count = this.notificationService.generalUnreadCount();
    return count > 0 ? String(count) : null;
  }

  protected async markAllAsRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
  }

  protected async onNotificationRead(id: string, notification: Notification): Promise<void> {
    if (!notification.is_read) {
      await this.notificationService.markAsRead(id);
    }
    if (notification.action_url) {
      void this.router.navigateByUrl(notification.action_url);
    }
  }
}
