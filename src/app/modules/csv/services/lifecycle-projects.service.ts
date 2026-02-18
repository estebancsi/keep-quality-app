import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, forkJoin, map, Observable, switchMap, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import {
  LifecycleProject,
  LifecycleProjectDto,
  LifecycleProjectStatus,
  LifecycleProjectType,
  LIFECYCLE_PROJECT_TRANSITIONS,
} from '../lifecycle-project.interface';
import { OrganizationService } from '@/auth/organization.service';

@Injectable({
  providedIn: 'root',
})
export class LifecycleProjectsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  private readonly systemSelect =
    'csv_systems(id, name, code, version, description, csv_categories(code))';

  // ─── List ────────────────────────────────────────────

  loadProjects(options?: {
    limit?: number;
    offset?: number;
    sortField?: string;
    sortOrder?: number;
    globalFilter?: string;
    typeFilter?: LifecycleProjectType[];
    statusFilter?: LifecycleProjectStatus[];
    systemId?: string;
  }): Observable<{ items: LifecycleProject[]; total: number }> {
    return defer(async () => {
      const limit = options?.limit ?? 25;
      const offset = options?.offset ?? 0;
      const sortField = options?.sortField ?? 'code';
      const ascending = (options?.sortOrder ?? -1) === 1;

      let query = this.supabase
        .from('csv_lifecycle_projects')
        .select(`*, ${this.systemSelect}`, { count: 'exact' });

      if (options?.globalFilter) {
        query = query.or(`notes.ilike.%${options.globalFilter}%`);
      }

      if (options?.typeFilter?.length) {
        query = query.in('type', options.typeFilter);
      }

      if (options?.statusFilter?.length) {
        query = query.in('status', options.statusFilter);
      }

      if (options?.systemId) {
        query = query.eq('system_id', options.systemId);
      }

      query = query.order(sortField, { ascending }).range(offset, offset + limit - 1);

      return query;
    }).pipe(
      map(({ data, error, count }) => {
        if (error) throw error;
        return {
          items: (data as LifecycleProjectDto[]).map((dto) => this.toDomain(dto)),
          total: count ?? 0,
        };
      }),
      catchError((error) => this.handleError(error, 'Load Lifecycle Projects')),
    );
  }

  // ─── Single ──────────────────────────────────────────

  getProject(id: string): Observable<LifecycleProject> {
    return defer(async () =>
      this.supabase
        .from('csv_lifecycle_projects')
        .select(`*, ${this.systemSelect}`)
        .eq('id', id)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.toDomain(data as LifecycleProjectDto);
      }),
      catchError((error) => this.handleError(error, 'Get Lifecycle Project')),
    );
  }

  // ─── Create ──────────────────────────────────────────

  createProject(project: Partial<LifecycleProject>): Observable<LifecycleProject> {
    const dto = this.toDto(project);
    dto.tenant_id = this.orgService.activeOrganizationId();
    const { id, csv_systems, code, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase
        .from('csv_lifecycle_projects')
        .insert(payload)
        .select(`*, ${this.systemSelect}`)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lifecycle project created successfully',
        });
        return this.toDomain(data as LifecycleProjectDto);
      }),
      catchError((error) => this.handleError(error, 'Create Lifecycle Project')),
    );
  }

  // ─── Update ──────────────────────────────────────────

  updateProject(id: string, project: Partial<LifecycleProject>): Observable<LifecycleProject> {
    const dto = this.toDto(project);
    const {
      id: _id,
      tenant_id,
      csv_systems,
      code,
      system_id,
      created_at,
      updated_at,
      ...payload
    } = dto;

    return defer(async () =>
      this.supabase
        .from('csv_lifecycle_projects')
        .update(payload)
        .eq('id', id)
        .select(`*, ${this.systemSelect}`)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lifecycle project updated successfully',
        });
        return this.toDomain(data as LifecycleProjectDto);
      }),
      catchError((error) => this.handleError(error, 'Update Lifecycle Project')),
    );
  }

  // ─── Delete ──────────────────────────────────────────

  deleteProject(id: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_lifecycle_projects').delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lifecycle project deleted successfully',
        });
      }),
      catchError((error) => this.handleError(error, 'Delete Lifecycle Project')),
    );
  }

  // ─── Status Transition ───────────────────────────────

  transitionStatus(
    project: LifecycleProject,
    newStatus: LifecycleProjectStatus,
  ): Observable<LifecycleProject> {
    const allowed = LIFECYCLE_PROJECT_TRANSITIONS[project.status];
    if (!allowed.includes(newStatus)) {
      return throwError(() => new Error(`Invalid transition: ${project.status} → ${newStatus}`));
    }

    const updates: Partial<LifecycleProject> = { status: newStatus };

    // Auto-set actual completion date
    if (newStatus === 'completed') {
      updates.actualCompletionDate = new Date().toISOString().split('T')[0];
    }

    return this.updateProject(project.id, updates).pipe(
      switchMap((updated) => {
        if (newStatus === 'completed') {
          return this.syncSystemStatus(updated).pipe(map(() => updated));
        }
        return [updated];
      }),
    );
  }

  // ─── System Status Sync on Completion ────────────────

  private syncSystemStatus(project: LifecycleProject): Observable<void> {
    const systemUpdates: Record<string, unknown> = {};

    switch (project.type as LifecycleProjectType) {
      case 'validation':
        systemUpdates['lifecycle_status'] = 'operational';
        systemUpdates['validation_status'] = 'validated';
        break;
      case 'periodic_review': {
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        systemUpdates['last_review_date'] = today;
        systemUpdates['next_review_date'] = nextYear.toISOString().split('T')[0];
        break;
      }
      case 'revalidation':
        systemUpdates['validation_status'] = 'validated';
        break;
      case 'retirement':
        systemUpdates['lifecycle_status'] = 'retired';
        break;
    }

    if (Object.keys(systemUpdates).length === 0) {
      return defer(async () => undefined) as Observable<void>;
    }

    return defer(async () =>
      this.supabase.from('csv_systems').update(systemUpdates).eq('id', project.systemId),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => this.handleError(error, 'Sync System Status')),
    );
  }

  // ─── Systems for picker ──────────────────────────────

  loadSystemsForPicker(): Observable<{ id: string; name: string; code: number }[]> {
    return defer(async () =>
      this.supabase.from('csv_systems').select('id, name, code').order('code', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as { id: string; name: string; code: number }[];
      }),
      catchError((error) => this.handleError(error, 'Load Systems for Picker')),
    );
  }

  // ─── Mapping ─────────────────────────────────────────

  private toDomain(dto: LifecycleProjectDto): LifecycleProject {
    return {
      id: dto.id,
      code: dto.code,
      systemId: dto.system_id,
      system: dto.csv_systems
        ? {
            id: dto.csv_systems.id,
            name: dto.csv_systems.name,
            code: dto.csv_systems.code,
            version: dto.csv_systems.version,
            description: dto.csv_systems.description,
            categoryCode: dto.csv_systems.csv_categories?.code,
          }
        : undefined,
      type: dto.type as LifecycleProjectType,
      status: dto.status as LifecycleProjectStatus,
      startDate: dto.start_date,
      targetCompletionDate: dto.target_completion_date,
      actualCompletionDate: dto.actual_completion_date,
      assignedTo: dto.assigned_to,
      notes: dto.notes,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private toDto(project: Partial<LifecycleProject>): LifecycleProjectDto {
    return {
      id: project.id ?? '',
      code: project.code ?? 0,
      system_id: project.systemId ?? '',
      type: project.type ?? 'validation',
      status: project.status ?? 'draft',
      start_date: project.startDate ?? null,
      target_completion_date: project.targetCompletionDate ?? null,
      actual_completion_date: project.actualCompletionDate ?? null,
      assigned_to: project.assignedTo ?? null,
      notes: project.notes ?? null,
      created_at: project.createdAt ?? '',
      updated_at: project.updatedAt ?? '',
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
