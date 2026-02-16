export interface AppConfig {
  apiUrl: string;
  apiReportsUrl: string;
  production: boolean;
  logLevel: string;
  oidc: {
    authority: string;
    clientId: string;
    scope: string;
    secureRoutes: string[];
  };
  idp: {
    projectId: string;
  };
  supabase: {
    url: string;
    key: string;
  };
}
