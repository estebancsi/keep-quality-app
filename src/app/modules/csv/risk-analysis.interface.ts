// ============================================================
// CSV Risk Analysis (FMEA) — Domain Interfaces
// ============================================================

/** Risk Analysis artifact domain model (1:1 with lifecycle project) */
export interface RiskAnalysisArtifact {
  id: string;
  lifecycleProjectId: string;
  customFieldValues?: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_risk_analysis_artifacts */
export interface RiskAnalysisArtifactDto {
  id: string;
  tenant_id?: string;
  lifecycle_project_id: string;
  custom_field_values?: Record<string, unknown>; // JSONB
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Risk Analysis Item (Row) domain model */
export interface RiskAnalysisItem {
  id: string;
  riskAnalysisArtifactId: string;
  code: number;
  position: number;
  failureMode: string;
  cause: string;
  effect: string;
  severity: number; // 1-3 (Low, Med, High)
  probability: number; // 1-3 (Low, Med, High)
  detectability: number; // 1-3 (High, Med, Low -> Note: 3 is Low Detectability/Bad)
  rpn: number; // Risk Priority Score (3=High, 2=Med, 1=Low)
  riskClass: number; // 1-3 (1=High, 2=Med, 3=Low)
  mitigation: string;
  traceUrsIds: string[];
  traceFsCsIds: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_risk_analysis_items */
export interface RiskAnalysisItemDto {
  id: string;
  tenant_id?: string;
  risk_analysis_artifact_id: string;
  code: number;
  position: number;
  failure_mode: string;
  cause: string;
  effect: string;
  severity: number;
  probability: number;
  detectability: number;
  rpn: number;
  risk_class: number;
  mitigation: string;
  trace_urs_ids: string[] | null;
  trace_fs_cs_ids: string[] | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
