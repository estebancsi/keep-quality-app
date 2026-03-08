import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend, HttpParams } from '@angular/common/http';
import { AppConfigService } from '@/config/app-config.service';
import { Observable } from 'rxjs';

export interface SignedUrlResponse {
  url: string;
}

export interface StorageObject {
  name: string;
  size: number;
  content_type: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private http = inject(HttpClient);
  private httpBackend = inject(HttpBackend);
  private bypassHttp = new HttpClient(this.httpBackend);
  private appConfig = inject(AppConfigService);

  private get apiUrl(): string {
    return `${this.appConfig.apiUrl()}/api/v1/storage`;
  }

  /**
   * Get a signed URL for uploading a file directly to storage.
   */
  getUploadUrl(objectName: string, contentType?: string): Observable<SignedUrlResponse> {
    const payload: { object_name: string; content_type?: string } = { object_name: objectName };
    if (contentType) {
      payload.content_type = contentType;
    }
    return this.http.post<SignedUrlResponse>(`${this.apiUrl}/signed-urls/upload`, payload);
  }

  /**
   * Upload a file directly to the given signed URL using PUT.
   */
  uploadFileToSignedUrl(file: File, uploadUrl: string): Observable<void> {
    return this.bypassHttp.put<void>(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  /**
   * Get a signed URL for downloading/viewing a file from storage.
   */
  getDownloadUrl(objectName: string): Observable<SignedUrlResponse> {
    return this.http.post<SignedUrlResponse>(`${this.apiUrl}/signed-urls/download`, {
      object_name: objectName,
    });
  }

  /**
   * Delete a file from storage.
   */
  deleteFile(objectName: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/objects/${encodeURIComponent(objectName)}`);
  }

  /**
   * List files in storage, optionally filtered by prefix.
   */
  listObjects(prefix?: string): Observable<StorageObject[]> {
    let params = new HttpParams();
    if (prefix) {
      params = params.set('prefix', prefix);
    }
    return this.http.get<StorageObject[]>(`${this.apiUrl}/objects`, { params });
  }
}
