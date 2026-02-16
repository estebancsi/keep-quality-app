import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map } from 'rxjs';
import { AppConfigService } from '@/config/app-config.service';
import { SupabaseService } from '@/core/services/supabase.service';
import { AuditSearchFilters, PaginatedAuditResponse } from './audit-trail.model';

/**
 * Service for querying audit trail data from both API and Supabase sources.
 *
 * - API source: for IAM/Users audit data (served by keep-quality-api).
 * - Supabase source: for application modules audit data (audit_trail table).
 */
@Injectable({
  providedIn: 'root',
})
export class AuditTrailService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly supabase = inject(SupabaseService);

  /**
   * Query audit trail from the API backend (IAM/Users).
   */
  getApiAuditTrail(filters: AuditSearchFilters): Observable<PaginatedAuditResponse> {
    return this.http.post<PaginatedAuditResponse>(
      `${this.appConfig.apiUrl()}/api/v1/audit-trail`,
      filters,
    );
  }

  /**
   * Query audit trail for a specific entity from the API backend.
   */
  getApiEntityAuditTrail(filters: AuditSearchFilters): Observable<PaginatedAuditResponse> {
    return this.http.post<PaginatedAuditResponse>(
      `${this.appConfig.apiUrl()}/api/v1/audit-trail/entity`,
      filters,
    );
  }

  /**
   * Query audit trail from the Supabase audit_trail table (application modules).
   */
  getSupabaseAuditTrail(filters: AuditSearchFilters): Observable<PaginatedAuditResponse> {
    return from(this.fetchSupabaseAudit(filters));
  }

  private async fetchSupabaseAudit(filters: AuditSearchFilters): Promise<PaginatedAuditResponse> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const ascending = filters.ascending ?? false;

    let query = this.supabase.client.from('audit_trail').select('*', { count: 'exact' });

    if (filters.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    query = query
      .order(filters.order_by ?? 'created_at', { ascending })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase audit trail query failed:', error);
      return { items: [], total: 0, limit, offset };
    }

    return {
      items: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    };
  }
}
