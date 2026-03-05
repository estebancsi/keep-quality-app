import { AppConfigService } from '@/config/app-config.service';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface PdfJobRequest {
  object_name: string;
  action_url: string;
  html: string;
  css?: string;
  header?: string;
  footer?: string;
  options?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface PdfJobResponse {
  correlation_id: string;
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfJobService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(AppConfigService);

  private get apiUrl(): string {
    return this.configService.apiUrl() || '';
  }

  submitPdfJob(request: PdfJobRequest): Observable<PdfJobResponse> {
    const url = this.apiUrl.endsWith('/')
      ? `${this.apiUrl}api/v1/jobs/pdf`
      : `${this.apiUrl}/api/v1/jobs/pdf`;
    return this.http.post<PdfJobResponse>(url, request);
  }
}
