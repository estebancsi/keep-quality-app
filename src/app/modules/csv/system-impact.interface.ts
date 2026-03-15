// ============================================================
// CSV System Impact Determination — Domain Interfaces
// ============================================================

// ─── Template ───────────────────────────────────────────────

/** A single question in the org-wide System Impact questionnaire */
export interface SystemImpactQuestion {
  /** Stable identifier (e.g. "Q1", "Q2") used as the answers map key */
  code: string;
  /** Human-readable question text */
  text: string;
  /** Display order */
  position: number;
}

/** Org-wide questionnaire template (one per tenant) */
export interface SystemImpactTemplate {
  id: string;
  questions: SystemImpactQuestion[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_system_impact_templates */
export interface SystemImpactTemplateDto {
  id: string;
  tenant_id?: string;
  questions: SystemImpactQuestion[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Artifact ───────────────────────────────────────────────

/** A user's answer to one question */
export interface SystemImpactAnswer {
  /** true = Yes, false = No, null = not yet answered */
  answer: boolean | null;
  /** Optional free-text justification */
  justification: string | null;
}

/** Per-project System Impact artifact */
export interface SystemImpactArtifact {
  id: string;
  lifecycleProjectId: string;
  /** Frozen snapshot of the template questions taken at initialization time */
  questionsSnapshot: SystemImpactQuestion[];
  /** Answers keyed by question code */
  answers: Record<string, SystemImpactAnswer>;
  /**
   * Final GxP impact judgment — automatically `true` when any answer is Yes,
   * `false` when all questions are answered No, `null` when no answers yet.
   */
  gxpImpact: boolean | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_system_impact_artifacts */
export interface SystemImpactArtifactDto {
  id: string;
  tenant_id?: string;
  lifecycle_project_id: string;
  questions_snapshot: SystemImpactQuestion[];
  answers: Record<string, SystemImpactAnswer>;
  /** Persisted derived judgment — true if any answer is Yes */
  gxp_impact: boolean | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
