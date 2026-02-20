import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, switchMap, throwError } from 'rxjs';
import { PdfTemplate, PdfTemplateDto } from '../interfaces/pdf-templates.types';
import { MessageService } from 'primeng/api';
import { TEMPLATE_SCHEMAS } from '../data/template-schemas';

@Injectable({
  providedIn: 'root',
})
export class PdfTemplatesService {
  private supabase = inject(SupabaseService).client;
  private messageService = inject(MessageService);

  getTemplateByName(name: string): Observable<PdfTemplate | null> {
    return defer(async () =>
      this.supabase.from('pdf_templates').select('*').eq('name', name).maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.toDomain(data) : null;
      }),
      catchError((error) => this.handleError(error, 'Get Template by Name')),
    );
  }

  getTemplateVariables(templateName: string): any {
    return TEMPLATE_SCHEMAS[templateName] || null;
  }

  saveTemplate(template: PdfTemplate): Observable<PdfTemplate> {
    const dto = this.toDto(template);

    // Instead of upsert on name (which fails on composite constraints without tenant_id),
    // we find the record first and handle insert/update accordingly.
    // This respects RLS as getTemplateByName only returns records for the current tenant.
    return this.getTemplateByName(template.name).pipe(
      map((existing) => {
        if (existing) {
          // If it exists, we update by ID
          return defer(async () =>
            this.supabase
              .from('pdf_templates')
              .update({ data: dto.data })
              .eq('id', existing.id)
              .select()
              .single(),
          );
        } else {
          // If not, we insert (tenant_id is handled by Trigger/RLS or passed if available)
          const { id, ...payload } = dto;
          return defer(async () =>
            this.supabase.from('pdf_templates').insert(payload).select().single(),
          );
        }
      }),
      switchMap((obs: Observable<any>) => obs),
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Template saved successfully',
        });
        return this.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Save Template')),
    );
  }

  private toDomain(dto: PdfTemplateDto): PdfTemplate {
    return {
      ...dto.data,
      id: dto.id,
      name: dto.name,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private toDto(domain: PdfTemplate): PdfTemplateDto {
    return {
      id: domain.id,
      name: domain.name,
      data: {
        html: domain.html,
        css: domain.css,
        header: domain.header,
        footer: domain.footer,
        options: domain.options,
      },
    };
  }

  private handleError(error: any, summary: string) {
    const errorMessage = error.message || 'An unexpected error occurred.';
    console.error(`[${summary}]`, errorMessage);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
    });
    return throwError(() => new Error(errorMessage));
  }
}
