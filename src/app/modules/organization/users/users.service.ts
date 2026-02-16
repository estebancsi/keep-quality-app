import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AppConfigService } from '@/config/app-config.service';
import {
  CreateUserRequest,
  PaginatedUsersResponse,
  ResetPasswordRequest,
  SyncUsersRequest,
  SyncUsersResponse,
  UpdateUserRequest,
  User,
  UserSearchRequest,
} from './users.interface';
import { OrganizationService } from '@/auth/organization.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);
  private appConfigService = inject(AppConfigService);
  private orgService = inject(OrganizationService);

  private get baseUrl(): string {
    return `${this.appConfigService.apiUrl()}/api/v1/users`;
  }

  searchUsers(request: UserSearchRequest): Observable<PaginatedUsersResponse> {
    request.organizationId = this.orgService.activeOrganizationId();
    return this.http.post<PaginatedUsersResponse>(this.baseUrl, request);
  }

  findUserByEmail(email: string): Observable<User | null> {
    return this.http
      .post<PaginatedUsersResponse>(this.baseUrl, {
        email,
        limit: 1,
        offset: 0,
        orderBy: 'created_at',
        ascending: false,
      })
      .pipe(map((res) => (res.items.length > 0 ? res.items[0] : null)));
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/new`, request);
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}`, request);
  }

  deactivateUser(id: string): Observable<User> {
    return this.http.delete<User>(`${this.baseUrl}/${id}`);
  }

  resetPassword(userId: string, request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${userId}/password/reset`, request);
  }

  syncUsers(request: SyncUsersRequest): Observable<SyncUsersResponse> {
    return this.http.post<SyncUsersResponse>(`${this.baseUrl}/sync`, request);
  }
}
