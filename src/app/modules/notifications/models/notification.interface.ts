export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type AudienceType = 'user' | 'project' | 'organization';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  audience_type: AudienceType;
  audience_id: string;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  notification_type: NotificationType;
  action_url?: string | null;
  metadata?: Record<string, unknown> | null;
  audience_type: AudienceType;
  audience_id: string;
  project_id?: string | null;
}
