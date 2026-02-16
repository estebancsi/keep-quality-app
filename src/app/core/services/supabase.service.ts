import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../../config/app-config.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private _client: SupabaseClient | null = null;
  private appConfig = inject(AppConfigService);
  private oidcSecurityService = inject(OidcSecurityService);

  private cachedSupabaseToken: string | null = null;
  private cachedOidcToken: string | null = null;

  get client(): SupabaseClient {
    if (this._client) {
      return this._client;
    }

    const config = this.appConfig.supabase();

    if (!config?.url || !config?.key) {
      throw new Error('Supabase configuration is missing. Check your environment variables.');
    }

    this._client = createClient(config.url, config.key, {
      global: {
        headers: {
          'X-Client-Info': 'keep-quality-app',
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => {
        return this.getSupabaseToken();
      },
    });
    return this._client;
  }

  private async getSupabaseToken(): Promise<string> {
    // 1. Get OIDC Token
    const oidcToken = await firstValueFrom(this.oidcSecurityService.getAccessToken());

    if (!oidcToken) {
      return '';
    }

    // 2. Check cache
    if (this.cachedOidcToken === oidcToken && this.cachedSupabaseToken) {
      return this.cachedSupabaseToken;
    }

    // 3. Exchange Token
    try {
      const supabaseToken = await this.exchangeToken(oidcToken);
      this.cachedOidcToken = oidcToken;
      this.cachedSupabaseToken = supabaseToken;
      return supabaseToken;
    } catch (error) {
      console.error('Failed to exchange token', error);
      return '';
    }
  }

  private async exchangeToken(oidcToken: string): Promise<string> {
    const config = this.appConfig.supabase();
    const functionUrl = `${config.url}/functions/v1/exchange-jwt`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oidcToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.supabaseJwt;
  }
}
