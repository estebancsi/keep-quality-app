import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, switchMap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import { ValidationPlanArtifact, ValidationPlanArtifactDto } from '../validation-plan.interface';

@Injectable({
  providedIn: 'root',
})
export class ValidationPlanService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Artifact ───────────────────────────────────────

  /**
   * Get existing validation plan artifact or create one for the given lifecycle project.
   */
  /**
   * Fetch an existing Validation Plan artifact for the given lifecycle project.
   * Returns null if the artifact hasn't been created yet (never throws for 404).
   */
  getArtifact(lifecycleProjectId: string): Observable<ValidationPlanArtifact | null> {
    return defer(async () =>
      this.supabase
        .from('csv_validation_plan_artifacts')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.artifactToDomain(data as ValidationPlanArtifactDto) : null;
      }),
      catchError((error) => this.handleError(error, 'Get Validation Plan Artifact')),
    );
  }

  /**
   * Create a new Validation Plan artifact for the given lifecycle project.
   */
  createArtifact(lifecycleProjectId: string): Observable<ValidationPlanArtifact> {
    const tenantId = this.orgService.activeOrganizationId();
    return defer(async () =>
      this.supabase
        .from('csv_validation_plan_artifacts')
        .insert({ tenant_id: tenantId, lifecycle_project_id: lifecycleProjectId })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.artifactToDomain(data as ValidationPlanArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Create Validation Plan Artifact')),
    );
  }

  /** @deprecated Use getArtifact() + createArtifact() separately. */
  getOrCreateArtifact(lifecycleProjectId: string): Observable<ValidationPlanArtifact> {
    return this.getArtifact(lifecycleProjectId).pipe(
      switchMap((artifact) =>
        artifact ? [artifact] : this.createArtifact(lifecycleProjectId),
      ),
    );
  }

  /** Persist custom field values on an existing artifact. */
  updateArtifactCustomFields(
    artifactId: string,
    customFieldValues: Record<string, unknown>,
  ): Observable<ValidationPlanArtifact> {
    return defer(async () =>
      this.supabase
        .from('csv_validation_plan_artifacts')
        .update({ custom_field_values: customFieldValues })
        .eq('id', artifactId)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Saved',
          detail: 'Validation Plan properties updated',
        });
        return this.artifactToDomain(data as ValidationPlanArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Update Validation Plan Custom Fields')),
    );
  }

  // ─── Mapping ────────────────────────────────────────

  private artifactToDomain(dto: ValidationPlanArtifactDto): ValidationPlanArtifact {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      customFieldValues: dto.custom_field_values,
      createdBy: dto.created_by,
      updatedBy: dto.updated_by,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  // ─── Error handling ─────────────────────────────────

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
