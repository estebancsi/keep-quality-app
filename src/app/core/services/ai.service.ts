import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AppConfigService } from '@/config/app-config.service';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  provider: string;
  model: string;
  system_prompt?: string;
  temperature?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private oidcSecurityService = inject(OidcSecurityService);
  private appConfigService = inject(AppConfigService);

  getModels(): Observable<Record<string, ModelInfo[]>> {
    return this.http.get<Record<string, ModelInfo[]>>(
      `${this.appConfigService.apiUrl()}/api/v1/ai/models`,
    );
  }

  async sendMessage(request: ChatRequest, onChunk: (chunk: string) => void): Promise<void> {
    const token = await firstValueFrom(this.oidcSecurityService.getAccessToken());
    const response = await fetch(`${this.appConfigService.apiUrl()}/api/v1/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  }
}
