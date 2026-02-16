/** Audit trail TypeScript interfaces for 21 CFR Part 11 compliance. */

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTION';

export interface FieldChange {
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export interface AuditEntry {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  action_label: string | null;
  user_id: string;
  reason: string | null;
  changes: FieldChange[];
  extra_metadata: Record<string, string> | null;
  created_at: string;
}

export interface AuditSearchFilters {
  tenant_id?: string;
  entity_type?: string;
  entity_id?: string;
  user_id?: string;
  action?: AuditAction;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  ascending?: boolean;
}

export interface PaginatedAuditResponse {
  items: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}
