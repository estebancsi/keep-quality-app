import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import {
  SystemImpactQuestion,
  SystemImpactTemplate,
  SystemImpactTemplateDto,
} from '../system-impact.interface';

@Injectable({
  providedIn: 'root',
})
export class SystemImpactTemplateService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Template ────────────────────────────────────────────

  /**
   * Fetch the single org-wide System Impact questionnaire template.
   * Returns null if the org hasn't set one up yet.
   */
  getTemplate(): Observable<SystemImpactTemplate | null> {
    return defer(async () =>
      this.supabase
        .from('csv_system_impact_templates')
        .select('*')
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.templateToDomain(data as SystemImpactTemplateDto) : null;
      }),
      catchError((error) => this.handleError(error, 'Get System Impact Template')),
    );
  }

  /**
   * Create or update the org-wide questionnaire template.
   * Uses upsert keyed on tenant_id (enforced by the unique index).
   */
  upsertTemplate(questions: SystemImpactQuestion[]): Observable<SystemImpactTemplate> {
    const tenantId = this.orgService.activeOrganizationId();
    return defer(async () =>
      this.supabase
        .from('csv_system_impact_templates')
        .upsert(
          { tenant_id: tenantId, questions },
          { onConflict: 'tenant_id' },
        )
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'System Impact template saved',
        });
        return this.templateToDomain(data as SystemImpactTemplateDto);
      }),
      catchError((error) => this.handleError(error, 'Save System Impact Template')),
    );
  }

  // ─── Mapping ─────────────────────────────────────────────

  private templateToDomain(dto: SystemImpactTemplateDto): SystemImpactTemplate {
    return {
      id: dto.id,
      questions: dto.questions ?? [],
      createdBy: dto.created_by,
      updatedBy: dto.updated_by,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  // ─── Error handling ──────────────────────────────────────

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
