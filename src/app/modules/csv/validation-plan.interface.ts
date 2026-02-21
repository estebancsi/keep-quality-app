// ============================================================
// CSV Validation Plan — Domain Interfaces
// ============================================================

/** Validation Plan artifact domain model (1:1 with lifecycle project) */
export interface ValidationPlanArtifact {
  id: string;
  lifecycleProjectId: string;
  customFieldValues: Record<string, unknown> | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_validation_plan_artifacts */
export interface ValidationPlanArtifactDto {
  id: string;
  tenant_id?: string;
  lifecycle_project_id: string;
  custom_field_values: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
