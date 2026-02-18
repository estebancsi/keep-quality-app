// ============================================================
// Computerized Systems Inventory — Domain Interfaces
// ============================================================

/** GAMP 5 category codes */
export type CategoryCode = 1 | 3 | 4 | 5;

/** Lifecycle status of a computerized system */
export type LifecycleStatus =
  | 'draft'
  | 'in_validation'
  | 'operational'
  | 'retired'
  | 'decommissioned';

/** Validation status of a computerized system */
export type ValidationStatus =
  | 'not_validated'
  | 'validation_in_progress'
  | 'validated'
  | 'revalidation_required';

/** Custom coding mode */
export type CustomCoding = 'automatic' | 'manual';

/** Computed risk level */
export type RiskLevel = 'low' | 'medium' | 'high';

/** GAMP 5 category lookup */
export interface CsvCategory {
  id: string;
  code: CategoryCode;
  name: string;
  description: string | null;
  typicalExamples: string | null;
  validationEffort: string | null;
}

/** Supabase row shape for csv_categories */
export interface CsvCategoryDto {
  id: string;
  code: number;
  name: string;
  description: string | null;
  typical_examples: string | null;
  validation_effort: string | null;
  created_at: string;
  updated_at: string;
}

/** Computerized system domain model */
export interface ComputerizedSystem {
  id: string;
  code: number;
  name: string;
  version: string | null;
  location: string | null;
  description: string | null;
  categoryId: string | null;
  category?: CsvCategory;
  customCoding: CustomCoding | null;
  lifecycleStatus: LifecycleStatus;
  validationStatus: ValidationStatus;
  riskPatientSafety: boolean;
  riskProductQuality: boolean;
  riskDataIntegrity: boolean;
  alcoaRelevant: boolean;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_systems */
export interface ComputerizedSystemDto {
  id: string;
  tenant_id?: string;
  code: number;
  name: string;
  version: string | null;
  location: string | null;
  description: string | null;
  category_id: string | null;
  csv_categories?: CsvCategoryDto;
  custom_coding: string | null;
  lifecycle_status: string;
  validation_status: string;
  risk_patient_safety: boolean;
  risk_product_quality: boolean;
  risk_data_integrity: boolean;
  alcoa_relevant: boolean;
  last_review_date: string | null;
  next_review_date: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Compute risk level from the 3 boolean flags */
export function computeRiskLevel(
  patientSafety: boolean,
  productQuality: boolean,
  dataIntegrity: boolean,
): RiskLevel {
  const trueCount = [patientSafety, productQuality, dataIntegrity].filter(Boolean).length;
  if (trueCount >= 2) return 'high';
  if (trueCount === 1) return 'medium';
  return 'low';
}

/** Label maps for display */
export const LIFECYCLE_STATUS_OPTIONS: { label: string; value: LifecycleStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'In Validation', value: 'in_validation' },
  { label: 'Operational', value: 'operational' },
  { label: 'Retired', value: 'retired' },
  { label: 'Decommissioned', value: 'decommissioned' },
];

export const VALIDATION_STATUS_OPTIONS: { label: string; value: ValidationStatus }[] = [
  { label: 'Not Validated', value: 'not_validated' },
  { label: 'Validation In Progress', value: 'validation_in_progress' },
  { label: 'Validated', value: 'validated' },
  { label: 'Revalidation Required', value: 'revalidation_required' },
];

export const CUSTOM_CODING_OPTIONS: { label: string; value: CustomCoding }[] = [
  { label: 'Automatic', value: 'automatic' },
  { label: 'Manual', value: 'manual' },
];
