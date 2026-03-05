import { Injectable, DestroyRef, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AppConfigService } from '@/config/app-config.service';
import { OrganizationService } from '@/auth/organization.service';
import {
  type CreateNotificationRequest,
  type Notification,
} from '../models/notification.interface';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(AppConfigService);
  private readonly oidcService = inject(OidcSecurityService);
  private readonly orgService = inject(OrganizationService);
  private readonly destroyRef = inject(DestroyRef);

  private eventSource: EventSource | null = null;

  // Plain boolean flag — avoids signal reads in reactive contexts causing loops
  private _loadingNotifications = false;

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly sseConnected = signal<boolean>(false);

  readonly inboxNotifications = computed(() =>
    this.notifications().filter((n) => n.audience_type === 'user'),
  );

  readonly generalNotifications = computed(() =>
    this.notifications().filter(
      (n) => n.audience_type === 'project' || n.audience_type === 'organization',
    ),
  );

  readonly archivedNotifications = computed(() => this.notifications().filter((n) => n.is_read));

  readonly inboxUnreadCount = computed(
    () => this.inboxNotifications().filter((n) => !n.is_read).length,
  );

  readonly generalUnreadCount = computed(
    () => this.generalNotifications().filter((n) => !n.is_read).length,
  );

  private get apiUrl(): string {
    return this.configService.apiUrl();
  }

  connectSse(): void {
    if (this.eventSource) return;

    firstValueFrom(this.oidcService.getAccessToken()).then((token) => {
      if (!token) return;

      const projectId = this.configService.idp().projectId;
      const organizationId = this.orgService.activeOrganizationId();

      const params = new URLSearchParams({ token });
      if (projectId) params.set('project_id', projectId);
      if (organizationId) params.set('organization_id', organizationId);

      const url = `${this.apiUrl}/api/v1/notifications/stream?${params.toString()}`;
      this.eventSource = new EventSource(url);
      this.sseConnected.set(true);

      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const notification = JSON.parse(event.data as string) as Notification;
          this.notifications.update((prev) => [notification, ...prev]);
          if (!notification.is_read) {
            this.unreadCount.update((c) => c + 1);
          }
        } catch {
          // ignore malformed events
        }
      };

      this.eventSource.onerror = () => {
        this.closeSse();
        setTimeout(() => this.connectSse(), 5000);
      };

      this.destroyRef.onDestroy(() => this.closeSse());
    });
  }

  private closeSse(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.sseConnected.set(false);
  }

  async loadNotifications(): Promise<void> {
    // Use a plain bool flag (not a signal read) to avoid triggering reactive loops
    if (this._loadingNotifications) return;
    this._loadingNotifications = true;
    this.loading.set(true);
    try {
      const result = await firstValueFrom(
        this.http.get<{ data: Notification[] | null }>(`${this.apiUrl}/api/v1/notifications`).pipe(
          map((r) => r.data ?? []),
          catchError((err) => {
            console.error('[NotificationService] Error loading notifications:', err);
            return of([]);
          }),
          timeout(10000),
          catchError(() => of([])),
        ),
      );
      this.notifications.set(result);
      const unread = result.filter((n) => !n.is_read).length;
      this.unreadCount.set(unread);
    } catch (e) {
      console.error('[NotificationService] Unexpected error in loadNotifications:', e);
    } finally {
      this._loadingNotifications = false;
      this.loading.set(false);
    }
  }

  async loadUnreadCount(): Promise<void> {
    const result = await firstValueFrom(
      this.http
        .get<{ count: number }>(`${this.apiUrl}/api/v1/notifications/unread-count`)
        .pipe(map((r) => r.count)),
    );
    this.unreadCount.set(result);
  }

  async markAsRead(id: string): Promise<void> {
    await firstValueFrom(
      this.http.patch<void>(`${this.apiUrl}/api/v1/notifications/${id}/read`, {}),
    );
    this.notifications.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    this.unreadCount.update((c) => Math.max(0, c - 1));
  }

  async markAllAsRead(): Promise<void> {
    await firstValueFrom(this.http.patch<void>(`${this.apiUrl}/api/v1/notifications/read-all`, {}));
    this.notifications.update((prev) => prev.map((n) => ({ ...n, is_read: true })));
    this.unreadCount.set(0);
  }

  async createNotification(payload: CreateNotificationRequest): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.apiUrl}/api/v1/notifications`, payload));
  }
}
