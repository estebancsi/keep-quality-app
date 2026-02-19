import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, switchMap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import {
  RiskAnalysisArtifact,
  RiskAnalysisArtifactDto,
  RiskAnalysisItem,
  RiskAnalysisItemDto,
} from '../risk-analysis.interface';

@Injectable({
  providedIn: 'root',
})
export class RiskAnalysisService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Artifact ───────────────────────────────────────

  /**
   * Get existing artifact or create one for the given lifecycle project.
   */
  getOrCreateArtifact(lifecycleProjectId: string): Observable<RiskAnalysisArtifact> {
    return defer(async () =>
      this.supabase
        .from('csv_risk_analysis_artifacts')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .maybeSingle(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        if (data) return [this.artifactToDomain(data as RiskAnalysisArtifactDto)];

        // Create new artifact
        const tenantId = this.orgService.activeOrganizationId();
        return defer(async () =>
          this.supabase
            .from('csv_risk_analysis_artifacts')
            .insert({
              tenant_id: tenantId,
              lifecycle_project_id: lifecycleProjectId,
            })
            .select('*')
            .single(),
        ).pipe(
          map(({ data: created, error: insertError }) => {
            if (insertError) throw insertError;
            return this.artifactToDomain(created as RiskAnalysisArtifactDto);
          }),
        );
      }),
      catchError((error) => this.handleError(error, 'Get/Create Risk Analysis Artifact')),
    );
  }

  updateArtifactCustomFields(
    id: string,
    customFieldValues: Record<string, unknown>,
  ): Observable<RiskAnalysisArtifact> {
    return defer(async () =>
      this.supabase
        .from('csv_risk_analysis_artifacts')
        .update({ custom_field_values: customFieldValues })
        .eq('id', id)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Document properties saved',
        });
        return this.artifactToDomain(data as RiskAnalysisArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Update Risk Analysis Custom Fields')),
    );
  }

  // ─── Items ──────────────────────────────────────────

  loadItems(artifactId: string): Observable<RiskAnalysisItem[]> {
    return defer(async () =>
      this.supabase
        .from('csv_risk_analysis_items')
        .select('*')
        .eq('risk_analysis_artifact_id', artifactId)
        .order('position', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as RiskAnalysisItemDto[]).map((dto) => this.itemToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load Risk Analysis Items')),
    );
  }

  createItem(artifactId: string, position: number): Observable<RiskAnalysisItem> {
    const tenantId = this.orgService.activeOrganizationId();

    return defer(async () =>
      this.supabase
        .from('csv_risk_analysis_items')
        .insert({
          tenant_id: tenantId,
          risk_analysis_artifact_id: artifactId,
          position,
          failure_mode: '',
          cause: '',
          effect: '',
          severity: 1,
          probability: 1,
          detectability: 1,
          rpn: 1,
          risk_class: 1,
          mitigation: '',
        })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Item added',
        });
        return this.itemToDomain(data as RiskAnalysisItemDto);
      }),
      catchError((error) => this.handleError(error, 'Create Risk Analysis Item')),
    );
  }

  updateItem(id: string, changes: Partial<RiskAnalysisItem>): Observable<RiskAnalysisItem> {
    const payload: Record<string, unknown> = {};
    if (changes.failureMode !== undefined) payload['failure_mode'] = changes.failureMode;
    if (changes.cause !== undefined) payload['cause'] = changes.cause;
    if (changes.effect !== undefined) payload['effect'] = changes.effect;
    if (changes.severity !== undefined) payload['severity'] = changes.severity;
    if (changes.probability !== undefined) payload['probability'] = changes.probability;
    if (changes.detectability !== undefined) payload['detectability'] = changes.detectability;
    if (changes.rpn !== undefined) payload['rpn'] = changes.rpn;
    if (changes.riskClass !== undefined) payload['risk_class'] = changes.riskClass;
    if (changes.mitigation !== undefined) payload['mitigation'] = changes.mitigation;
    if (changes.traceUrsIds !== undefined) payload['trace_urs_ids'] = changes.traceUrsIds;
    if (changes.traceFsCsIds !== undefined) payload['trace_fs_cs_ids'] = changes.traceFsCsIds;
    if (changes.position !== undefined) payload['position'] = changes.position;

    return defer(async () =>
      this.supabase
        .from('csv_risk_analysis_items')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.itemToDomain(data as RiskAnalysisItemDto);
      }),
      catchError((error) => this.handleError(error, 'Update Risk Analysis Item')),
    );
  }

  deleteItem(id: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_risk_analysis_items').delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Item deleted',
        });
      }),
      catchError((error) => this.handleError(error, 'Delete Risk Analysis Item')),
    );
  }

  updatePositions(updates: { id: string; position: number }[]): Observable<void> {
    return defer(async () => {
      for (const { id, position } of updates) {
        const { error } = await this.supabase
          .from('csv_risk_analysis_items')
          .update({ position })
          .eq('id', id);
        if (error) throw error;
      }
    }).pipe(catchError((error) => this.handleError(error, 'Update Positions')));
  }

  // ─── Mapping ────────────────────────────────────────

  private artifactToDomain(dto: RiskAnalysisArtifactDto): RiskAnalysisArtifact {
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

  private itemToDomain(dto: RiskAnalysisItemDto): RiskAnalysisItem {
    return {
      id: dto.id,
      riskAnalysisArtifactId: dto.risk_analysis_artifact_id,
      code: dto.code,
      position: dto.position,
      failureMode: dto.failure_mode,
      cause: dto.cause,
      effect: dto.effect,
      severity: dto.severity,
      probability: dto.probability,
      detectability: dto.detectability,
      rpn: dto.rpn,
      riskClass: dto.risk_class,
      mitigation: dto.mitigation,
      traceUrsIds: dto.trace_urs_ids ?? [],
      traceFsCsIds: dto.trace_fs_cs_ids ?? [],
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
