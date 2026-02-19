import { HttpHandlerFn, HttpRequest } from '@angular/common/http';

/**
 * This interceptor ensures that when OIDC silently refreshes the token,
 * it includes the dynamic organization ID in the scope.
 *
 * Without this, Zitadel (or any OIDC provider) will issue a new token
 * based only on the static scopes configured at startup, losing the
 * currently active organization claim.
 */
export function oidcRefreshInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  // We first try to get the organization ID from localStorage because signals
  // might not be initialized yet during a background refresh.
  const activeOrgId = localStorage.getItem('activeOrgId');

  // We only target POST requests to the token endpoint that are refresh requests
  if (
    req.method === 'POST' &&
    req.url.endsWith('/token') &&
    typeof req.body === 'string' &&
    req.body.includes('refresh_token') &&
    activeOrgId
  ) {
    const orgScope = `urn:zitadel:iam:org:id:${activeOrgId}`;

    // Check if the scope is already present in the body to avoid duplication
    if (!req.body.includes(orgScope)) {
      const bodyParams = new URLSearchParams(req.body);
      let scope = bodyParams.get('scope') || '';

      // Append the dynamic org scope
      scope = scope ? `${scope} ${orgScope}` : orgScope;
      bodyParams.set('scope', scope);

      const clonedReq = req.clone({
        body: bodyParams.toString(),
        headers: req.headers.set('Content-Type', 'application/x-www-form-urlencoded'),
      });

      return next(clonedReq);
    }
  }

  return next(req);
}
