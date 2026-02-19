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

  private isTokenExpired(token: string): boolean {
    const payload = decodeJwt(token);
    if (!payload?.exp) {
      return true;
    }
    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    const buffer = 2 * 60 * 1000; // 2 minutes buffer
    return expirationTime - now < buffer;
  }

  private hasCorrectOrgClaim(token: string): boolean {
    const activeOrgId = localStorage.getItem('activeOrgId');
    if (!activeOrgId) return true; // No active org to enforce

    const payload = decodeJwt(token);
    const tokenOrgId = payload?.['urn:zitadel:iam:org:id'];
    return tokenOrgId === activeOrgId;
  }

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

    // 2. Check cache and expiration and org claim
    if (this.cachedOidcToken === oidcToken && this.cachedSupabaseToken) {
      if (
        !this.isTokenExpired(this.cachedSupabaseToken) &&
        this.hasCorrectOrgClaim(this.cachedSupabaseToken)
      ) {
        return this.cachedSupabaseToken;
      }

      if (!this.hasCorrectOrgClaim(this.cachedSupabaseToken)) {
        // We might also need to force the OIDC token to refresh if it doesn't have the claim either
        const oidcPayload = decodeJwt(oidcToken);
        const oidcOrgId = oidcPayload?.['urn:zitadel:iam:org:id'];
        const activeOrgId = localStorage.getItem('activeOrgId');

        if (activeOrgId && oidcOrgId !== activeOrgId) {
          // To prevent infinite loops we don't await the force refresh here, we let it happen
          // in the background. The current call might fail if Supabase strictly requires the org,
          // but the next query will succeed.
          this.oidcSecurityService.forceRefreshSession().subscribe();
        }
      }
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

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT', error);
    return null;
  }
}
