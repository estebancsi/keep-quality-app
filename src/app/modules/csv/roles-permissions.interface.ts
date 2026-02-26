import { AttachmentCache } from '@/core/interfaces/attachment.interface';

export interface CsvRole {
  id: string;
  lifecycleProjectId: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CsvPermission {
  id: string;
  lifecycleProjectId: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CsvRolePermissionMapping {
  id: string;
  lifecycleProjectId: string;
  roleId: string;
  permissionId: string;
  expectedAccess: 'Granted' | 'Restricted' | 'N/A';
  createdAt?: string;
  updatedAt?: string;
}

export interface CsvRolePermissionTestResult {
  id: string;
  lifecycleProjectId: string;
  mappingId: string;
  actualResult: string;
  attachmentUrls: AttachmentCache[];
  status: 'Pass' | 'Fail' | 'Pending';
  testedBy?: string;
  testedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Supabase DTOs ───────────────────────────────────

export interface CsvRoleDto {
  id: string;
  lifecycle_project_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface CsvPermissionDto {
  id: string;
  lifecycle_project_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface CsvRolePermissionMappingDto {
  id: string;
  lifecycle_project_id: string;
  role_id: string;
  permission_id: string;
  expected_access: 'Granted' | 'Restricted' | 'N/A';
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface CsvRolePermissionTestResultDto {
  id: string;
  lifecycle_project_id: string;
  mapping_id: string;
  actual_result: string;
  attachment_urls: AttachmentCache[];
  status: 'Pass' | 'Fail' | 'Pending';
  tested_by: string | null;
  tested_at: string | null;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}
