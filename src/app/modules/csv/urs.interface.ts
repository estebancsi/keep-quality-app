// ============================================================
// CSV URS — Domain Interfaces
// ============================================================

/** URS artifact domain model (1:1 with lifecycle project) */
export interface UrsArtifact {
  id: string;
  lifecycleProjectId: string;
  customFieldValues: Record<string, unknown> | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_urs_artifacts */
export interface UrsArtifactDto {
  id: string;
  tenant_id?: string;
  lifecycle_project_id: string;
  custom_field_values: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** URS requirement domain model */
export type UrsCategory = 'Functional' | 'Configuration' | 'Design';

export interface UrsRequirement {
  id: string;
  ursArtifactId: string;
  code: number;
  position: number;
  description: string;
  category: UrsCategory;
  groupName: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_urs_requirements */
export interface UrsRequirementDto {
  id: string;
  tenant_id?: string;
  urs_artifact_id: string;
  code: number;
  position: number;
  description: string;
  category: UrsCategory;
  group_name: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
