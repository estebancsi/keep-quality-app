import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AppConfig } from './app-config.interface';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private configSignal = signal<AppConfig | null>(null);

  readonly oidcDefaultScope =
    'openid profile email offline_access urn:zitadel:iam:org:project:id:zitadel:aud';

  constructor(private http: HttpClient) {}

  loadConfig(): Promise<void> {
    // console.log('🔄 Loading application configuration from config.json...');
    return lastValueFrom(this.http.get<AppConfig>('config.json'))
      .then((config) => {
        // console.log('✅ Configuration loaded successfully:', config);
        // Apply fallbacks for optional URLs (similar to old environment pattern)
        const processedConfig: AppConfig = {
          ...config,
          apiReportsUrl: config.apiReportsUrl || config.apiUrl,
          oidc: {
            ...config.oidc,
            scope: [this.oidcDefaultScope, config.oidc.scope].join(' '),
            secureRoutes: config.apiUrl ? [config.apiUrl] : ['/api'],
          },
        };
        // console.log('🔧 Processed configuration:', processedConfig);
        this.configSignal.set(processedConfig);
      })
      .catch((err) => {
        console.error(
          '❌ CRITICAL: Could not load app configuration from config.json\n' +
            'Make sure public/config.json exists and is accessible\n',
          err,
        );
        throw err;
      });
  }

  get config() {
    const c = this.configSignal();
    if (!c) {
      console.error(
        '❌ Config not loaded! This likely means the provideAppInitializer failed.\n' +
          'Check the network tab for failed requests to config.json\n',
      );
      throw new Error('Application configuration not loaded. Please check the console for errors.');
    }
    return c;
  }

  // Check if config is loaded (useful for guards and components)
  get isConfigLoaded(): boolean {
    return this.configSignal() !== null;
  }

  // Computed signals for easy access
  // These will throw if config is not loaded, which is intentional
  // to catch configuration issues early
  readonly apiUrl = computed(() => this.config.apiUrl);
  readonly apiReportsUrl = computed(() => this.config.apiReportsUrl);
  readonly production = computed(() => this.config.production);
  readonly logLevel = computed(() => this.config.logLevel);
  readonly oidc = computed(() => this.config.oidc);
  readonly idp = computed(() => this.config.idp);
  readonly supabase = computed(() => this.config.supabase);
}
