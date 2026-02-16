import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../config/app-config.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AuthorizationFilter,
  AuthorizationResponse,
  CreateAuthorizationRequest,
  ExternalUserSearchRequest,
} from './iam.interface';

@Injectable({
  providedIn: 'root',
})
export class IamService {
  private http = inject(HttpClient);
  private configService = inject(AppConfigService);

  private get apiUrl() {
    return this.configService.apiUrl();
  }

  getAuthorizations(filter: AuthorizationFilter): Observable<AuthorizationResponse[]> {
    return this.http
      .post<{ data: AuthorizationResponse[] }>(`${this.apiUrl}/api/v1/iam/authorizations`, filter)
      .pipe(map((res) => res.data));
  }

  createAuthorization(req: CreateAuthorizationRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/api/v1/iam/authorizations/new`, req);
  }

  deleteAuthorization(authorizationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/v1/iam/authorizations/${authorizationId}`);
  }

  getExternalUsers(req: ExternalUserSearchRequest): Observable<AuthorizationResponse[]> {
    return this.http
      .post<{
        data: AuthorizationResponse[];
      }>(`${this.apiUrl}/api/v1/iam/authorizations/external-users`, req)
      .pipe(map((res) => res.data));
  }
}
