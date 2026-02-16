export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string;
  fullName: string;
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  status: UserStatus;
  idpUserId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchFilters {
  email?: string;
  username?: string;
  organizationId?: string;
  isActive?: boolean;
}

export interface PaginationParams {
  limit: number;
  offset: number;
  orderBy: string;
  ascending: boolean;
}

export interface UserSearchRequest extends UserSearchFilters, PaginationParams {}

export interface PaginatedUsersResponse {
  items: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  organizationId?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  requirePasswordChange: boolean;
}

export interface SyncUsersRequest {
  organizationId?: string;
  batchSize?: number;
}

export interface SyncUsersResponse {
  synced: number;
  errors: number;
  total: number;
}
