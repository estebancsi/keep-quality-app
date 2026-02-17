// ============================================================
// CSV FS/CS — Domain Interfaces
// ============================================================

export type FsCsRequirementType = 'Functional' | 'Configuration' | 'Design';

/** FS/CS artifact domain model (1:1 with lifecycle project) */
export interface FsCsArtifact {
  id: string;
  lifecycleProjectId: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  customFieldValues?: Record<string, any>;
}

/** Supabase row shape for csv_fs_cs_artifacts */
export interface FsCsArtifactDto {
  id: string;
  tenant_id?: string;
  lifecycle_project_id: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  custom_field_values?: Record<string, any>; // JSONB
}

/** FS/CS requirement domain model */
export interface FsCsRequirement {
  id: string;
  fsCsArtifactId: string;
  reqType: FsCsRequirementType;
  code: number;
  category: string | null;
  position: number;
  description: string;
  traceUrsIds: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_fs_cs_requirements */
export interface FsCsRequirementDto {
  id: string;
  tenant_id?: string;
  fs_cs_artifact_id: string;
  req_type: string;
  code: number;
  category: string | null;
  position: number;
  description: string;
  trace_urs_ids: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
