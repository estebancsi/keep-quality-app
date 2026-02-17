// ============================================================
// CSV Lifecycle Projects — Domain Interfaces
// ============================================================

import {
  ComputerizedSystem,
  ComputerizedSystemDto,
  CsvCategoryDto,
} from './computerized-systems.interface';

/** Lifecycle project phase types */
export type LifecycleProjectType = 'validation' | 'periodic_review' | 'revalidation' | 'retirement';

/** Lifecycle project status */
export type LifecycleProjectStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

/** Lifecycle project domain model */
export interface LifecycleProject {
  id: string;
  code: number;
  systemId: string;
  system?: Pick<ComputerizedSystem, 'id' | 'name' | 'code'> & { categoryCode?: number };
  type: LifecycleProjectType;
  status: LifecycleProjectStatus;
  startDate: string | null;
  targetCompletionDate: string | null;
  actualCompletionDate: string | null;
  assignedTo: string | null;
  assignedToName?: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Supabase row shape for csv_lifecycle_projects */
export interface LifecycleProjectDto {
  id: string;
  tenant_id?: string;
  code: number;
  system_id: string;
  csv_systems?: Pick<ComputerizedSystemDto, 'id' | 'name' | 'code'> & {
    csv_categories?: Pick<CsvCategoryDto, 'code'>;
  };
  type: string;
  status: string;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Label maps for display */
export const LIFECYCLE_PROJECT_TYPE_OPTIONS: { label: string; value: LifecycleProjectType }[] = [
  { label: 'Validation', value: 'validation' },
  { label: 'Periodic Review', value: 'periodic_review' },
  { label: 'Revalidation', value: 'revalidation' },
  { label: 'Retirement', value: 'retirement' },
];

export const LIFECYCLE_PROJECT_STATUS_OPTIONS: {
  label: string;
  value: LifecycleProjectStatus;
}[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

/** Allowed status transitions (state machine) */
export const LIFECYCLE_PROJECT_TRANSITIONS: Record<
  LifecycleProjectStatus,
  LifecycleProjectStatus[]
> = {
  draft: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['draft'],
};
