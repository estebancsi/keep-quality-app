import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
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

  // ─── Delete ──────────────────────────────────────────

  deleteAttachment(id: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_lifecycle_attachments').delete().eq('id', id),
    ).pipe(
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
