import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import {
  BehaviorSubject,
  catchError,
  defer,
  map,
  Observable,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
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

  public readonly requirementsChanged = new BehaviorSubject<void>(undefined);

  // ─── Artifact ───────────────────────────────────────

  /**
   * Get existing artifact or create one for the given lifecycle project.
   */
  /**
   * Fetch an existing FS/CS artifact for the given lifecycle project.
   * Returns null if the artifact hasn't been created yet (never throws for 404).
   */
  getArtifact(lifecycleProjectId: string): Observable<FsCsArtifact | null> {
    return defer(async () =>
      this.supabase
        .from('csv_fs_cs_artifacts')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.artifactToDomain(data as FsCsArtifactDto) : null;
      }),
      catchError((error) => this.handleError(error, 'Get FS/CS Artifact')),
    );
  }

  /**
   * Create a new FS/CS artifact for the given lifecycle project.
   */
  createArtifact(lifecycleProjectId: string): Observable<FsCsArtifact> {
    const tenantId = this.orgService.activeOrganizationId();
    return defer(async () =>
      this.supabase
        .from('csv_fs_cs_artifacts')
        .insert({ tenant_id: tenantId, lifecycle_project_id: lifecycleProjectId })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.artifactToDomain(data as FsCsArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Create FS/CS Artifact')),
    );
  }

  /** @deprecated Use getArtifact() + createArtifact() separately. */
  getOrCreateArtifact(lifecycleProjectId: string): Observable<FsCsArtifact> {
    return this.getArtifact(lifecycleProjectId).pipe(
      switchMap((artifact) =>
        artifact ? [artifact] : this.createArtifact(lifecycleProjectId),
      ),
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
      tap(() => this.requirementsChanged.next()),
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
        group_name: req.groupName || null,
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
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Create FS/CS Requirements (Bulk)')),
    );
  }

  /**
   * Bulk create requirements with mixed types.
   */
  createMixedRequirements(
    artifactId: string,
    requirements: (Partial<FsCsRequirement> & { reqType: FsCsRequirementType })[],
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
        req_type: req.reqType,
        position: currentPos++,
        description: req.description || '',
        group_name: req.groupName || null,
        trace_urs_ids: req.traceUrsIds || [],
      }));

      // 3. Insert
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
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Create FS/CS Mixed Requirements')),
    );
  }

  updateRequirement(id: string, changes: Partial<FsCsRequirement>): Observable<FsCsRequirement> {
    const payload: Record<string, unknown> = {};
    if (changes.description !== undefined) payload['description'] = changes.description;
    if (changes.groupName !== undefined) payload['group_name'] = changes.groupName;
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
      tap(() => this.requirementsChanged.next()),
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
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Delete FS/CS Requirement')),
    );
  }

  deleteRequirements(ids: string[]): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_fs_cs_requirements').delete().in('id', ids),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${ids.length} requirements deleted`,
        });
      }),
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Delete FS/CS Requirements (Bulk)')),
    );
  }

  bulkUpdateRequirements(ids: string[], changes: Partial<FsCsRequirement>): Observable<void> {
    const payload: Record<string, unknown> = {};
    if (changes.groupName !== undefined) payload['group_name'] = changes.groupName;
    if (changes.traceUrsIds !== undefined) payload['trace_urs_ids'] = changes.traceUrsIds;

    return defer(async () =>
      this.supabase.from('csv_fs_cs_requirements').update(payload).in('id', ids),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${ids.length} requirements updated`,
        });
      }),
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Update FS/CS Requirements (Bulk)')),
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
    }).pipe(
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Update Positions')),
    );
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
      groupName: dto.group_name,
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
