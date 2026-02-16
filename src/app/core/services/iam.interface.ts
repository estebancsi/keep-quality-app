export interface OrganizationResponse {
  id: string;
  name: string;
}

export interface ProjectResponse {
  id: string;
  name?: string;
  organizationId?: string;
}

export interface UserResponse {
  id: string;
  preferredLoginName?: string;
  displayName?: string;
  organizationId?: string;
}

export interface AuthorizationResponse {
  id: string;
  project: ProjectResponse;
  user: UserResponse;
  organization: OrganizationResponse;
  creationDate: string;
  changeDate: string;
  state?: string;
}

export interface AuthorizationFilter {
  userIds?: string[];
  projectId?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
}

export interface CreateAuthorizationRequest {
  userId: string;
  projectId: string;
  organizationId: string;
}

export interface ExternalUserSearchRequest {
  projectId: string;
  excludeOrganizationId: string;
}
