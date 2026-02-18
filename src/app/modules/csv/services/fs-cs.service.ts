import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, switchMap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '@/auth/organization.service';
import {
  FsCsArtifact,
  FsCsArtifactDto,
  FsCsRequirement,
  FsCsRequirementDto,
  FsCsRequirementType,
} from '../fs-cs.interface';

@Injectable({
  providedIn: 'root',
})
export class FsCsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Artifact ───────────────────────────────────────

  /**
   * Get existing artifact or create one for the given lifecycle project.
   */
  getOrCreateArtifact(lifecycleProjectId: string): Observable<FsCsArtifact> {
    return defer(async () =>
      this.supabase
        .from('csv_fs_cs_artifacts')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .maybeSingle(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        if (data) return [this.artifactToDomain(data as FsCsArtifactDto)];

        // Create new artifact
        const tenantId = this.orgService.activeOrganizationId();
        return defer(async () =>
          this.supabase
            .from('csv_fs_cs_artifacts')
            .insert({
              tenant_id: tenantId,
              lifecycle_project_id: lifecycleProjectId,
            })
            .select('*')
            .single(),
        ).pipe(
          map(({ data: created, error: insertError }) => {
            if (insertError) throw insertError;
            return this.artifactToDomain(created as FsCsArtifactDto);
          }),
        );
      }),
      catchError((error) => this.handleError(error, 'Get/Create FS/CS Artifact')),
    );
  }

  // ─── Requirements ───────────────────────────────────

  /**
   * Load requirements for a specific artifact, optionally filtered by type.
   */
  loadRequirements(
    artifactId: string,
    reqType?: FsCsRequirementType,
  ): Observable<FsCsRequirement[]> {
    return defer(async () => {
      let query = this.supabase
        .from('csv_fs_cs_requirements')
        .select('*')
        .eq('fs_cs_artifact_id', artifactId)
        .order('position', { ascending: true });

      if (reqType) {
        query = query.eq('req_type', reqType);
      }

      return query;
    }).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as FsCsRequirementDto[]).map((dto) => this.requirementToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load FS/CS Requirements')),
    );
  }

  createRequirement(
    artifactId: string,
    reqType: FsCsRequirementType,
    position: number,
  ): Observable<FsCsRequirement> {
    const tenantId = this.orgService.activeOrganizationId();

    return defer(async () =>
      this.supabase
        .from('csv_fs_cs_requirements')
        .insert({
          tenant_id: tenantId,
          fs_cs_artifact_id: artifactId,
          req_type: reqType,
          position,
          description: '',
        })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Requirement added',
        });
        return this.requirementToDomain(data as FsCsRequirementDto);
      }),
      catchError((error) => this.handleError(error, 'Create FS/CS Requirement')),
    );
  }

  /**
   * Bulk create requirements.
   */
  createRequirements(
    artifactId: string,
    reqType: FsCsRequirementType,
    requirements: Partial<FsCsRequirement>[],
  ): Observable<FsCsRequirement[]> {
    const tenantId = this.orgService.activeOrganizationId();

    return defer(async () => {
      // 1. Get current max position to append
      const { data: maxPosData, error: maxPosError } = await this.supabase
        .from('csv_fs_cs_requirements')
        .select('position')
        .eq('fs_cs_artifact_id', artifactId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxPosError) throw maxPosError;
      let currentPos = (maxPosData?.position ?? -1) + 1;

      // 2. Prepare inserts
      const inserts = requirements.map((req) => ({
        tenant_id: tenantId,
        fs_cs_artifact_id: artifactId,
        req_type: reqType,
        position: currentPos++,
        description: req.description || '',
        category: req.category || null,
        trace_urs_ids: req.traceUrsIds || [],
      }));

      // 3. Insert
      // Note: Supabase bulk insert returns array
      const { data, error } = await this.supabase
        .from('csv_fs_cs_requirements')
        .insert(inserts)
        .select('*');

      return { data, error };
    }).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${(data as FsCsRequirementDto[]).length} requirements added`,
        });
        return (data as FsCsRequirementDto[]).map((dto) => this.requirementToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Create FS/CS Requirements (Bulk)')),
    );
  }

  updateRequirement(id: string, changes: Partial<FsCsRequirement>): Observable<FsCsRequirement> {
    const payload: Record<string, unknown> = {};
    if (changes.description !== undefined) payload['description'] = changes.description;
    if (changes.category !== undefined) payload['category'] = changes.category;
    if (changes.traceUrsIds !== undefined) payload['trace_urs_ids'] = changes.traceUrsIds;
    if (changes.position !== undefined) payload['position'] = changes.position;

    return defer(async () =>
      this.supabase
        .from('csv_fs_cs_requirements')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.requirementToDomain(data as FsCsRequirementDto);
      }),
      catchError((error) => this.handleError(error, 'Update FS/CS Requirement')),
    );
  }

  deleteRequirement(id: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_fs_cs_requirements').delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Requirement deleted',
        });
      }),
      catchError((error) => this.handleError(error, 'Delete FS/CS Requirement')),
    );
  }

  /**
   * Bulk update positions.
   */
  updatePositions(updates: { id: string; position: number }[]): Observable<void> {
    return defer(async () => {
      for (const { id, position } of updates) {
        const { error } = await this.supabase
          .from('csv_fs_cs_requirements')
          .update({ position })
          .eq('id', id);
        if (error) throw error;
      }
    }).pipe(catchError((error) => this.handleError(error, 'Update Positions')));
  }

  // ─── Mapping ────────────────────────────────────────

  private artifactToDomain(dto: FsCsArtifactDto): FsCsArtifact {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      createdBy: dto.created_by,
      updatedBy: dto.updated_by,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      customFieldValues: dto.custom_field_values,
    };
  }

  updateArtifactCustomFields(
    id: string,
    customFieldValues: Record<string, unknown>,
  ): Observable<FsCsArtifact> {
    return defer(async () =>
      this.supabase
        .from('csv_fs_cs_artifacts')
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
        return this.artifactToDomain(data as FsCsArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Update FS/CS Custom Fields')),
    );
  }

  private requirementToDomain(dto: FsCsRequirementDto): FsCsRequirement {
    return {
      id: dto.id,
      fsCsArtifactId: dto.fs_cs_artifact_id,
      reqType: dto.req_type as FsCsRequirementType,
      code: dto.code,
      category: dto.category,
      position: dto.position,
      description: dto.description,
      traceUrsIds: dto.trace_urs_ids ?? [],
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
    // @module/core/services/supabase.service usually returns PostgrestError which has message
    return throwError(() => new Error(errorMessage));
  }
}
