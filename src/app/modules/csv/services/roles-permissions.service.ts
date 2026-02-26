import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@/core/services/supabase.service';
import { OrganizationService } from '@/auth/organization.service';
import { MessageService } from 'primeng/api';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import {
  CsvRole,
  CsvRoleDto,
  CsvPermission,
  CsvPermissionDto,
  CsvRolePermissionMapping,
  CsvRolePermissionMappingDto,
  CsvRolePermissionTestResult,
  CsvRolePermissionTestResultDto,
} from '../roles-permissions.interface';

@Injectable({
  providedIn: 'root',
})
export class RolesPermissionsService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly orgService = inject(OrganizationService);
  private readonly messageService = inject(MessageService);

  // --- Roles ---

  getRolesByProjectId(projectId: string): Observable<CsvRole[]> {
    return defer(async () =>
      this.supabase
        .from('csv_project_roles')
        .select('*')
        .eq('lifecycle_project_id', projectId)
        .order('name', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as CsvRoleDto[]).map((dto) => this.roleToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load Roles')),
    );
  }

  addRole(role: Partial<CsvRole>): Observable<CsvRole> {
    const dto = this.roleToDto(role);
    dto.tenant_id = this.orgService.activeOrganizationId();
    const { id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase.from('csv_project_roles').insert(payload).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.roleToDomain(data as CsvRoleDto);
      }),
      catchError((error) => this.handleError(error, 'Add Role')),
    );
  }

  updateRole(id: string, role: Partial<CsvRole>): Observable<CsvRole> {
    const dto = this.roleToDto(role);
    const { id: _id, tenant_id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase.from('csv_project_roles').update(payload).eq('id', id).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.roleToDomain(data as CsvRoleDto);
      }),
      catchError((error) => this.handleError(error, 'Update Role')),
    );
  }

  deleteRole(id: string): Observable<void> {
    return defer(async () => this.supabase.from('csv_project_roles').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => this.handleError(error, 'Delete Role')),
    );
  }

  // --- Permissions ---

  getPermissionsByProjectId(projectId: string): Observable<CsvPermission[]> {
    return defer(async () =>
      this.supabase
        .from('csv_project_permissions')
        .select('*')
        .eq('lifecycle_project_id', projectId)
        .order('name', { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as CsvPermissionDto[]).map((dto) => this.permissionToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load Permissions')),
    );
  }

  addPermission(permission: Partial<CsvPermission>): Observable<CsvPermission> {
    const dto = this.permissionToDto(permission);
    dto.tenant_id = this.orgService.activeOrganizationId();
    const { id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase.from('csv_project_permissions').insert(payload).select('*').single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.permissionToDomain(data as CsvPermissionDto);
      }),
      catchError((error) => this.handleError(error, 'Add Permission')),
    );
  }

  updatePermission(id: string, permission: Partial<CsvPermission>): Observable<CsvPermission> {
    const dto = this.permissionToDto(permission);
    const { id: _id, tenant_id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase
        .from('csv_project_permissions')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.permissionToDomain(data as CsvPermissionDto);
      }),
      catchError((error) => this.handleError(error, 'Update Permission')),
    );
  }

  deletePermission(id: string): Observable<void> {
    return defer(async () =>
      this.supabase.from('csv_project_permissions').delete().eq('id', id),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => this.handleError(error, 'Delete Permission')),
    );
  }

  // --- Mappings ---

  getMappingsByProjectId(projectId: string): Observable<CsvRolePermissionMapping[]> {
    return defer(async () =>
      this.supabase
        .from('csv_project_role_permissions')
        .select('*')
        .eq('lifecycle_project_id', projectId),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as CsvRolePermissionMappingDto[]).map((dto) => this.mappingToDomain(dto));
      }),
      catchError((error) => this.handleError(error, 'Load Mappings')),
    );
  }

  saveMapping(mapping: Partial<CsvRolePermissionMapping>): Observable<CsvRolePermissionMapping> {
    const dto = this.mappingToDto(mapping);
    dto.tenant_id = this.orgService.activeOrganizationId();
    const { id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase
        .from('csv_project_role_permissions')
        .upsert(
          { ...payload, lifecycle_project_id: mapping.lifecycleProjectId },
          { onConflict: 'role_id, permission_id' },
        )
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mappingToDomain(data as CsvRolePermissionMappingDto);
      }),
      catchError((error) => this.handleError(error, 'Save Mapping')),
    );
  }

  // --- Test Results ---

  getTestResultsByProjectId(projectId: string): Observable<CsvRolePermissionTestResult[]> {
    return defer(async () =>
      this.supabase
        .from('csv_project_role_permission_test_results')
        .select('*')
        .eq('lifecycle_project_id', projectId),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data as CsvRolePermissionTestResultDto[]).map((dto) =>
          this.testResultToDomain(dto),
        );
      }),
      catchError((error) => this.handleError(error, 'Load Test Results')),
    );
  }

  saveTestResult(
    result: Partial<CsvRolePermissionTestResult>,
  ): Observable<CsvRolePermissionTestResult> {
    const dto = this.testResultToDto(result);
    dto.tenant_id = this.orgService.activeOrganizationId();
    const { id, created_at, updated_at, ...payload } = dto;

    return defer(async () =>
      this.supabase
        .from('csv_project_role_permission_test_results')
        .upsert(payload, { onConflict: 'mapping_id' })
        .select('*')
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.testResultToDomain(data as CsvRolePermissionTestResultDto);
      }),
      catchError((error) => this.handleError(error, 'Save Test Result')),
    );
  }

  // --- Mappings (Domain <-> DTO) ---

  private roleToDomain(dto: CsvRoleDto): CsvRole {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      name: dto.name,
      description: dto.description,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private roleToDto(role: Partial<CsvRole>): Partial<CsvRoleDto> {
    const dto: Partial<CsvRoleDto> = {};
    if (role.id !== undefined) dto.id = role.id;
    if (role.lifecycleProjectId !== undefined) dto.lifecycle_project_id = role.lifecycleProjectId;
    if (role.name !== undefined) dto.name = role.name;
    if (role.description !== undefined) dto.description = role.description;
    if (role.createdAt !== undefined) dto.created_at = role.createdAt;
    if (role.updatedAt !== undefined) dto.updated_at = role.updatedAt;
    return dto;
  }

  private permissionToDomain(dto: CsvPermissionDto): CsvPermission {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      name: dto.name,
      description: dto.description,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private permissionToDto(permission: Partial<CsvPermission>): Partial<CsvPermissionDto> {
    const dto: Partial<CsvPermissionDto> = {};
    if (permission.id !== undefined) dto.id = permission.id;
    if (permission.lifecycleProjectId !== undefined)
      dto.lifecycle_project_id = permission.lifecycleProjectId;
    if (permission.name !== undefined) dto.name = permission.name;
    if (permission.description !== undefined) dto.description = permission.description;
    if (permission.createdAt !== undefined) dto.created_at = permission.createdAt;
    if (permission.updatedAt !== undefined) dto.updated_at = permission.updatedAt;
    return dto;
  }

  private mappingToDomain(dto: CsvRolePermissionMappingDto): CsvRolePermissionMapping {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      roleId: dto.role_id,
      permissionId: dto.permission_id,
      expectedAccess: dto.expected_access,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private mappingToDto(
    mapping: Partial<CsvRolePermissionMapping>,
  ): Partial<CsvRolePermissionMappingDto> {
    const dto: Partial<CsvRolePermissionMappingDto> = {};
    if (mapping.id !== undefined) dto.id = mapping.id;
    if (mapping.lifecycleProjectId !== undefined)
      dto.lifecycle_project_id = mapping.lifecycleProjectId;
    if (mapping.roleId !== undefined) dto.role_id = mapping.roleId;
    if (mapping.permissionId !== undefined) dto.permission_id = mapping.permissionId;
    if (mapping.expectedAccess !== undefined) dto.expected_access = mapping.expectedAccess;
    if (mapping.createdAt !== undefined) dto.created_at = mapping.createdAt;
    if (mapping.updatedAt !== undefined) dto.updated_at = mapping.updatedAt;
    return dto;
  }

  private testResultToDomain(dto: CsvRolePermissionTestResultDto): CsvRolePermissionTestResult {
    return {
      id: dto.id,
      lifecycleProjectId: dto.lifecycle_project_id,
      mappingId: dto.mapping_id,
      actualResult: dto.actual_result,
      attachmentUrls: dto.attachment_urls || [],
      status: dto.status,
      testedBy: dto.tested_by || undefined,
      testedAt: dto.tested_at || undefined,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }

  private testResultToDto(
    result: Partial<CsvRolePermissionTestResult>,
  ): Partial<CsvRolePermissionTestResultDto> {
    const dto: Partial<CsvRolePermissionTestResultDto> = {};
    if (result.id !== undefined) dto.id = result.id;
    if (result.lifecycleProjectId !== undefined)
      dto.lifecycle_project_id = result.lifecycleProjectId;
    if (result.mappingId !== undefined) dto.mapping_id = result.mappingId;
    if (result.actualResult !== undefined) dto.actual_result = result.actualResult;
    if (result.attachmentUrls !== undefined) dto.attachment_urls = result.attachmentUrls;
    if (result.status !== undefined) dto.status = result.status;
    if (result.testedBy !== undefined) dto.tested_by = result.testedBy;
    if (result.testedAt !== undefined) dto.tested_at = result.testedAt;
    if (result.createdAt !== undefined) dto.created_at = result.createdAt;
    if (result.updatedAt !== undefined) dto.updated_at = result.updatedAt;
    return dto;
  }

  private handleError(error: unknown, summary: string): Observable<never> {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    this.messageService.add({
      severity: 'error',
      summary: `Error: ${summary}`,
      detail: errorMessage,
    });
    return throwError(() => new Error(errorMessage));
  }
}
