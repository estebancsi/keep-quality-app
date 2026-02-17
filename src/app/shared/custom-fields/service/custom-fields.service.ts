import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { CustomFieldsSchema } from '../types/custom-fields.types';
import { CustomFieldsSchemaMapper } from '../utils/custom-fields-schema.mapper';
import { OrganizationService } from '@/auth/organization.service';

@Injectable({
  providedIn: 'root',
})
export class CustomFieldsService {
  private supabase = inject(SupabaseService).client;
  private mapper = new CustomFieldsSchemaMapper();
  private orgService = inject(OrganizationService);

  // New CRUD operations for custom_fields_schemas table
  getAllSchemas(): Observable<CustomFieldsSchema[]> {
    return defer(async () =>
      this.supabase.from('custom_fields_schemas').select('*').order('name'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapper.toDomainList(data || []);
      }),
      catchError((error) => this.handleError(error, 'Get All Schemas')),
    );
  }

  getSchemaById(id: string): Observable<CustomFieldsSchema> {
    return defer(async () =>
      this.supabase.from('custom_fields_schemas').select('*').eq('id', id).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapper.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Get Schema by ID')),
    );
  }

  getSchemaByName(name: string): Observable<CustomFieldsSchema> {
    return defer(async () =>
      this.supabase.from('custom_fields_schemas').select('*').eq('name', name).single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapper.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Get Schema by Name')),
    );
  }

  createSchema(schema: CustomFieldsSchema): Observable<CustomFieldsSchema> {
    const dbSchema = this.mapper.toPersistence(schema);
    dbSchema.tenant_id = this.orgService.activeOrganizationId();

    return defer(async () =>
      this.supabase.from('custom_fields_schemas').insert(dbSchema).select().single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapper.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Create Schema')),
    );
  }

  updateSchema(id: string, schema: CustomFieldsSchema): Observable<CustomFieldsSchema> {
    const dbSchema = this.mapper.toUpdatePersistence(schema);

    return defer(async () =>
      this.supabase
        .from('custom_fields_schemas')
        .update({
          ...dbSchema,
        })
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapper.toDomain(data);
      }),
      catchError((error) => this.handleError(error, 'Update Schema')),
    );
  }

  deleteSchema(id: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('custom_fields_schemas').delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => this.handleError(error, 'Delete Schema')),
    );
  }

  private handleError(error: Error, summary: string) {
    const errorMessage = error.message || 'An unexpected error occurred.';
    console.error(`[${summary}]`, errorMessage);
    // this.notificationService.showError(errorMessage, summary);
    return throwError(() => new Error(errorMessage));
  }
}
