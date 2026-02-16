import { AppConfigService } from '@/config/app-config.service';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

export interface PDFOptions {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'A3' | 'Letter';
  title: string;
  header?: string;
  footer?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  printBackground?: boolean;
  linearize?: boolean;
}

export interface RenderRawRequest {
  html: string;
  css?: string;
  header?: string;
  footer?: string;
  options?: PDFOptions;
  data?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private http = inject(HttpClient);
  private configService = inject(AppConfigService);
  private get apiUrl() {
    return this.configService.apiReportsUrl() || '';
  }

  async getTemplateContent(templateName: string): Promise<any> {
    return await firstValueFrom(
      this.http.get('/static/vit/bases-datos/templates/' + templateName, { responseType: 'text' }),
    );
  }

  renderRaw(body: RenderRawRequest): Observable<Blob> {
    const url = this.apiUrl.endsWith('/')
      ? `${this.apiUrl}api/templates/render-raw`
      : `${this.apiUrl}/api/templates/render-raw`;
    return this.http.post<Blob>(url, body, {
      responseType: 'blob' as 'json',
    });
  }

  convertHtmlToPDF(htmlContent: string, options: PDFOptions): Observable<Blob> {
    const payload = {
      content: htmlContent,
      options,
    };
    const url = this.apiUrl.endsWith('/')
      ? `${this.apiUrl}api/converter/html-to-pdf`
      : `${this.apiUrl}/api/converter/html-to-pdf`;
    return this.http.post<Blob>(url, payload, {
      responseType: 'blob' as 'json',
    });
  }
}
