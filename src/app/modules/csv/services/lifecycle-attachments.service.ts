import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, throwError, of, switchMap, forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import { StorageService } from '@/core/services/storage.service';
import {
  AttachmentStatus,
  LifecycleAttachment,
  LifecycleAttachmentDto,
} from '../lifecycle-attachment.interface';

@Injectable({
  providedIn: 'root',
})
export class LifecycleAttachmentsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);
  private readonly storageService = inject(StorageService);

  // ─── List ────────────────────────────────────────────

  loadAttachments(projectId: string): Observable<LifecycleAttachment[]> {
    return defer(async () =>
      this.supabase
        .from('csv_lifecycle_attachments')
        .select('*')
        .eq('lifecycle_project_id', projectId)
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as LifecycleAttachmentDto[]).map((dto) => this.toDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load Attachments')),
    );
  }

  // ─── Create ──────────────────────────────────────────

  createAttachment(attachment: Partial<LifecycleAttachment>): Observable<LifecycleAttachment> {
    const dto = this.toDto(attachment);
    dto.tenant_id = this.orgService.activeOrganizationId();
    const { id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase.from('csv_lifecycle_attachments').insert(payload).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toDomain(data as LifecycleAttachmentDto);
      }),
      catchError((error) => this.handleError(error, 'Create Attachment')),
    );
  }

  // ─── Update Status ───────────────────────────────────

  updateAttachmentStatus(id: string, status: AttachmentStatus): Observable<LifecycleAttachment> {
    return defer(async () =>
      this.supabase
        .from('csv_lifecycle_attachments')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toDomain(data as LifecycleAttachmentDto);
      }),
      catchError((error) => this.handleError(error, 'Update Attachment Status')),
    );
  }

  // ─── Sync Statuses ───────────────────────────────────

  syncPublishingStatuses(
    attachments: LifecycleAttachment[],
    projectId: string,
  ): Observable<LifecycleAttachment[]> {
    const publishingExists = attachments.some((a) => a.status === 'publishing');
    if (!publishingExists) {
      return of(attachments);
    }

    const prefix = `lifecycle-projects/${projectId}/attachments/`;
    return this.storageService.listObjects(prefix).pipe(
      switchMap((objects) => {
        const objectNames = new Set(objects.map((o) => o.name));
        const updates: Observable<LifecycleAttachment>[] = [];

        for (const attachment of attachments) {
          if (attachment.status === 'publishing' && objectNames.has(attachment.objectName)) {
            updates.push(this.updateAttachmentStatus(attachment.id, 'published'));
          }
        }

        if (updates.length === 0) {
          return of(attachments);
        }

        return forkJoin(updates).pipe(
          map((updatedAttachments) => {
            const updatedMap = new Map(updatedAttachments.map((a) => [a.id, a]));
            return attachments.map((a) => updatedMap.get(a.id) || a);
          }),
        );
      }),
      catchError((error) => {
        console.error('[Sync Publishing Statuses]', error);
        return of(attachments);
      }),
    );
  }

  // ─── Delete ──────────────────────────────────────────

  deleteAttachment(id: string, objectName: string): Observable<void> {
    return this.storageService.deleteFile(objectName).pipe(
      catchError((err) => {
        console.error('Failed to delete file from storage, proceeding to delete record', err);
        return of(void 0);
      }),
      switchMap(() =>
        defer(async () => this.supabase.from('csv_lifecycle_attachments').delete().eq('id', id)),
      ),
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Attachment deleted successfully',
        });
      }),
      catchError((error) => this.handleError(error, 'Delete Attachment')),
    );
  }

  // ─── Mapping ─────────────────────────────────────────

  private toDomain(dto: LifecycleAttachmentDto): LifecycleAttachment {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      name: dto.name,
      objectName: dto.object_name,
      status: dto.status as AttachmentStatus,
      contentType: dto.content_type,
      fileSize: dto.file_size,
      createdBy: dto.created_by,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private toDto(attachment: Partial<LifecycleAttachment>): LifecycleAttachmentDto {
    return {
      id: attachment.id ?? '',
      tenant_id: '',
      lifecycle_project_id: attachment.lifecycleProjectId ?? '',
      name: attachment.name ?? '',
      object_name: attachment.objectName ?? '',
      status: attachment.status ?? 'publishing',
      content_type: attachment.contentType ?? 'application/pdf',
      file_size: attachment.fileSize ?? null,
      created_by: attachment.createdBy ?? null,
      created_at: attachment.createdAt ?? '',
      updated_at: attachment.updatedAt ?? '',
    };
  }

  // ─── Error handling ──────────────────────────────────

  private handleError(error: unknown, summary: string): Observable<never> {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error(`[${summary}]`, errorMessage);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
    });
    return throwError(() => new Error(errorMessage));
  }
}
