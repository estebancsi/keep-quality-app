// DTO for database persistence (matches the table structure)
export interface CustomFieldsSchemaDto {
  id?: string;
  name: string;
  description?: string | null;
  schema_definition?: {
    groups?: any[];
    fields?: any[];
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
}
