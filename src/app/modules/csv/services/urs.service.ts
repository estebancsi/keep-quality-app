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
import { UrsArtifact, UrsArtifactDto, UrsRequirement, UrsRequirementDto } from '../urs.interface';

@Injectable({
  providedIn: 'root',
})
export class UrsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  public readonly requirementsChanged = new BehaviorSubject<void>(undefined);

  // ─── Artifact ───────────────────────────────────────

  /**
   * Get existing artifact or create one for the given lifecycle project.
   * Uses an upsert-like pattern: try select first, insert if not found.
   */
  /**
   * Fetch an existing URS artifact for the given lifecycle project.
   * Returns null if the artifact hasn't been created yet (never throws for 404).
   */
  getArtifact(lifecycleProjectId: string): Observable<UrsArtifact | null> {
    return defer(async () =>
      this.supabase
        .from('csv_urs_artifacts')
        .select('*')
        .eq('lifecycle_project_id', lifecycleProjectId)
        .maybeSingle(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? this.artifactToDomain(data as UrsArtifactDto) : null;
      }),
      catchError((error) => this.handleError(error, 'Get URS Artifact')),
    );
  }

  /**
   * Create a new URS artifact for the given lifecycle project.
   * Caller is responsible for ensuring it doesn't already exist.
   */
  createArtifact(lifecycleProjectId: string): Observable<UrsArtifact> {
    const tenantId = this.orgService.activeOrganizationId();
    return defer(async () =>
      this.supabase
        .from('csv_urs_artifacts')
        .insert({ tenant_id: tenantId, lifecycle_project_id: lifecycleProjectId })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.artifactToDomain(data as UrsArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Create URS Artifact')),
    );
  }

  /** @deprecated Use getArtifact() + createArtifact() separately. */
  getOrCreateArtifact(lifecycleProjectId: string): Observable<UrsArtifact> {
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
  ): Observable<UrsArtifact> {
    return defer(async () =>
      this.supabase
        .from('csv_urs_artifacts')
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
          detail: 'Custom fields updated',
        });
        return this.artifactToDomain(data as UrsArtifactDto);
      }),
      catchError((error) => this.handleError(error, 'Update Custom Fields')),
    );
  }

  // ─── Requirements ───────────────────────────────────

  loadRequirements(artifactId: string): Observable<UrsRequirement[]> {
    return defer(async () =>
      this.supabase
        .from('csv_urs_requirements')
        .select('*')
        .eq('urs_artifact_id', artifactId)
        .order('position', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as UrsRequirementDto[]).map((dto) => this.requirementToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load URS Requirements')),
    );
  }

  createRequirement(artifactId: string, position: number): Observable<UrsRequirement> {
    const tenantId = this.orgService.activeOrganizationId();

    return defer(async () =>
      this.supabase
        .from('csv_urs_requirements')
        .insert({
          tenant_id: tenantId,
          urs_artifact_id: artifactId,
          position,
          description: '',
          category: 'Functional', // Default
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
        return this.requirementToDomain(data as UrsRequirementDto);
      }),
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Create URS Requirement')),
    );
  }

  updateRequirement(id: string, changes: Partial<UrsRequirement>): Observable<UrsRequirement> {
    const payload: Record<string, unknown> = {};
    if (changes.description !== undefined) payload['description'] = changes.description;
    if (changes.category !== undefined) payload['category'] = changes.category;
    if (changes.groupName !== undefined) payload['group_name'] = changes.groupName;
    if (changes.position !== undefined) payload['position'] = changes.position;

    return defer(async () =>
      this.supabase.from('csv_urs_requirements').update(payload).eq('id', id).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.requirementToDomain(data as UrsRequirementDto);
      }),
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Update URS Requirement')),
    );
  }

  /**
   * Bulk create requirements.
   */
  createRequirements(
    artifactId: string,
    requirements: Partial<UrsRequirement>[],
  ): Observable<UrsRequirement[]> {
    const tenantId = this.orgService.activeOrganizationId();

    return defer(async () => {
      // 1. Get current max position to append
      const { data: maxPosData, error: maxPosError } = await this.supabase
        .from('csv_urs_requirements')
        .select('position')
        .eq('urs_artifact_id', artifactId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxPosError) throw maxPosError;
      let currentPos = (maxPosData?.position ?? -1) + 1;

      // 2. Prepare inserts
      const inserts = requirements.map((req) => ({
        tenant_id: tenantId,
        urs_artifact_id: artifactId,
        position: currentPos++,
        description: req.description || '',
        category: req.category || 'Functional',
        group_name: req.groupName || null,
        code: req.code, // Assuming code generation is handled by DB or ignored if serial
      }));

      // 3. Insert
      const { data, error } = await this.supabase
        .from('csv_urs_requirements')
        .insert(inserts)
        .select('*');

      return { data, error };
    }).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${(data as UrsRequirementDto[]).length} requirements added`,
        });
        return (data as UrsRequirementDto[]).map((dto) => this.requirementToDomain(dto));
      }),
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Create URS Requirements (Bulk)')),
    );
  }

  deleteRequirement(id: string): Observable<void> {
    return defer(async () => this.supabase.from('csv_urs_requirements').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Requirement deleted',
        });
      }),
      tap(() => this.requirementsChanged.next()),
      catchError((error) => this.handleError(error, 'Delete URS Requirement')),
    );
  }

  deleteRequirements(ids: string[]): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_urs_requirements').delete().in('id', ids),
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
      catchError((error) => this.handleError(error, 'Delete URS Requirements (Bulk)')),
    );
  }

  bulkUpdateRequirements(ids: string[], changes: Partial<UrsRequirement>): Observable<void> {
    const payload: Record<string, unknown> = {};
    if (changes.category !== undefined) payload['category'] = changes.category;
    if (changes.groupName !== undefined) payload['group_name'] = changes.groupName;

    return defer(async () =>
      this.supabase.from('csv_urs_requirements').update(payload).in('id', ids),
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
      catchError((error) => this.handleError(error, 'Update URS Requirements (Bulk)')),
    );
  }

  /**
   * Bulk update positions after drag-and-drop reorder.
   * Uses individual updates wrapped in sequential calls.
   */
  updatePositions(updates: { id: string; position: number }[]): Observable<void> {
    return defer(async () => {
      for (const { id, position } of updates) {
        const { error } = await this.supabase
          .from('csv_urs_requirements')
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

  private artifactToDomain(dto: UrsArtifactDto): UrsArtifact {
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

  private requirementToDomain(dto: UrsRequirementDto): UrsRequirement {
    return {
      id: dto.id,
      ursArtifactId: dto.urs_artifact_id,
      code: dto.code,
      position: dto.position,
      description: dto.description,
      category: dto.category,
      groupName: dto.group_name,
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
