import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import {
  ComputerizedSystem,
  ComputerizedSystemDto,
  CsvCategory,
  CsvCategoryDto,
  CategoryCode,
  CustomCoding,
  LifecycleStatus,
  ValidationStatus,
} from '../computerized-systems.interface';
import { OrganizationService } from '@/auth/organization.service';

@Injectable({
  providedIn: 'root',
})
export class ComputerizedSystemsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly messageService = inject(MessageService);
  private readonly orgService = inject(OrganizationService);

  // ─── Categories ──────────────────────────────────────

  loadCategories(): Observable<CsvCategory[]> {
    return defer(async () =>
      this.supabase.from('csv_categories').select('*').order('code', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as CsvCategoryDto[]).map((dto) => this.categoryToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load Categories')),
    );
  }

  // ─── Systems ─────────────────────────────────────────

  loadSystems(options?: {
    limit?: number;
    offset?: number;
    sortField?: string;
    sortOrder?: number;
    globalFilter?: string;
  }): Observable<{ items: ComputerizedSystem[]; total: number }> {
    return defer(async () => {
      const limit = options?.limit ?? 25;
      const offset = options?.offset ?? 0;
      const sortField = options?.sortField ?? 'code';
      const ascending = (options?.sortOrder ?? 1) === 1;

      let query = this.supabase
        .from('csv_systems')
        .select('*, csv_categories(*)', { count: 'exact' });

      if (options?.globalFilter) {
        query = query.or(
          `name.ilike.%${options.globalFilter}%,description.ilike.%${options.globalFilter}%,location.ilike.%${options.globalFilter}%`,
        );
      }

      query = query.order(sortField, { ascending }).range(offset, offset + limit - 1);

      return query;
    }).pipe(
      map(({ data, error, count }) => {
        if (error) throw error;
        return {
          items: (data as ComputerizedSystemDto[]).map((dto) => this.systemToDomain(dto)),
          total: count ?? 0,
        };
      }),
      catchError((error) => this.handleError(error, 'Load Systems')),
    );
  }

  getSystem(id: string): Observable<ComputerizedSystem> {
    return defer(async () =>
      this.supabase.from('csv_systems').select('*, csv_categories(*)').eq('id', id).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.systemToDomain(data as ComputerizedSystemDto);
      }),
      catchError((error) => this.handleError(error, 'Get System')),
    );
  }

  createSystem(system: Partial<ComputerizedSystem>): Observable<ComputerizedSystem> {
    const dto = this.systemToDto(system);
    dto.tenant_id = this.orgService.activeOrganizationId();
    // Remove auto-managed fields so Supabase uses database defaults/triggers
    const { id, csv_categories, code, created_at, updated_at, category_id, ...rest } = dto;

    // Only include category_id if it has a real value (not empty string)
    const payload: Record<string, unknown> = { ...rest };
    if (category_id) {
      payload['category_id'] = category_id;
    }

    return defer(async () =>
      this.supabase.from('csv_systems').insert(payload).select('*, csv_categories(*)').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'System created successfully',
        });
        return this.systemToDomain(data as ComputerizedSystemDto);
      }),
      catchError((error) => this.handleError(error, 'Create System')),
    );
  }

  updateSystem(id: string, system: Partial<ComputerizedSystem>): Observable<ComputerizedSystem> {
    const dto = this.systemToDto(system);
    const { id: _id, tenant_id, csv_categories, code, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase
        .from('csv_systems')
        .update(payload)
        .eq('id', id)
        .select('*, csv_categories(*)')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'System updated successfully',
        });
        return this.systemToDomain(data as ComputerizedSystemDto);
      }),
      catchError((error) => this.handleError(error, 'Update System')),
    );
  }

  deleteSystem(id: string): Observable<void> {
    return defer(async () => this.supabase.from('csv_systems').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'System deleted successfully',
        });
      }),
      catchError((error) => this.handleError(error, 'Delete System')),
    );
  }

  // ─── Mapping ─────────────────────────────────────────

  private categoryToDomain(dto: CsvCategoryDto): CsvCategory {
    return {
      id: dto.id,
      code: dto.code as CategoryCode,
      name: dto.name,
      description: dto.description,
      typicalExamples: dto.typical_examples,
      validationEffort: dto.validation_effort,
    };
  }

  private systemToDomain(dto: ComputerizedSystemDto): ComputerizedSystem {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      version: dto.version,
      location: dto.location,
      description: dto.description,
      categoryId: dto.category_id,
      category: dto.csv_categories ? this.categoryToDomain(dto.csv_categories) : undefined,
      customCoding: dto.custom_coding as CustomCoding | null,
      lifecycleStatus: dto.lifecycle_status as LifecycleStatus,
      validationStatus: dto.validation_status as ValidationStatus,
      riskPatientSafety: dto.risk_patient_safety,
      riskProductQuality: dto.risk_product_quality,
      riskDataIntegrity: dto.risk_data_integrity,
      alcoaRelevant: dto.alcoa_relevant,
      lastReviewDate: dto.last_review_date,
      nextReviewDate: dto.next_review_date,
      reviewNotes: dto.review_notes,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private systemToDto(system: Partial<ComputerizedSystem>): ComputerizedSystemDto {
    return {
      id: system.id ?? '',
      code: system.code ?? 0,
      name: system.name ?? '',
      version: system.version ?? null,
      location: system.location ?? null,
      description: system.description ?? null,
      category_id: system.categoryId ?? null,
      custom_coding: system.customCoding ?? null,
      lifecycle_status: system.lifecycleStatus ?? 'draft',
      validation_status: system.validationStatus ?? 'not_validated',
      risk_patient_safety: system.riskPatientSafety ?? false,
      risk_product_quality: system.riskProductQuality ?? false,
      risk_data_integrity: system.riskDataIntegrity ?? false,
      alcoa_relevant: system.alcoaRelevant ?? false,
      last_review_date: system.lastReviewDate ?? null,
      next_review_date: system.nextReviewDate ?? null,
      review_notes: system.reviewNotes ?? null,
      created_at: system.createdAt ?? '',
      updated_at: system.updatedAt ?? '',
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
