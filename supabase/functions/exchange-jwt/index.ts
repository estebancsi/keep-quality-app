import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import jwt from 'npm:jsonwebtoken';
import jwks from 'npm:jwks-rsa';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Max-Age': '3600',
};

// Read environment variables
const zitadelUrl = Deno.env.get('ZITADEL_URL');
const supabaseJwtSecret = Deno.env.get('SB_JWT_SECRET');
if (!zitadelUrl || !supabaseJwtSecret) throw new Error('Missing env vars');

// Get JWKS URI from Zitadel's OpenID configuration
async function getJwksUri(): Promise<string> {
  const configUrl = `${zitadelUrl}/.well-known/openid-configuration`;
  const response = await fetch(configUrl);
  const config = await response.json();
  return config.jwks_uri;
}

// Extract Bearer token from Authorization header
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

// Verify JWT token with Zitadel's public key
async function verifyToken(token: string): Promise<any> {
  // Decode token to get key ID
  const decoded = jwt.decode(token, { complete: true }) as any;
  if (!decoded?.header?.kid) {
    throw new Error('Invalid token: missing key ID');
  }

  // Get JWKS URI and create JWKS client
  const jwksUri = await getJwksUri();
  const jwksClient = jwks({ jwksUri });

  // Get the signing key
  const key = await jwksClient.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();

  // Verify the token
  const options = {
    algorithms: ['RS256'],
    issuer: zitadelUrl,
  };

  return jwt.verify(token, signingKey, options);
}

// Sign a new JWT with Supabase secret
async function signSupabaseJwt(payload: any): Promise<string> {
  // 1. Fresh timestamps to avoid clock skew or reuse issues
  const now = Math.floor(Date.now() / 1000);

  // 2. Build a clean payload. Zitadel tokens often contain claims like 'nonce' or 'at_hash'
  // that can confuse PostgREST if they are present but not handled by its verification logic.
  const supabasePayload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: payload.sub,
    email: payload.email,
    'urn:zitadel:iam:org:id': payload['urn:zitadel:iam:org:id'],
    iat: now,
    exp: now + 3600, // 1 hour
  };

  // Sign with Supabase JWT secret
  const supabaseSecret = new TextEncoder().encode(supabaseJwtSecret);

  const supabaseJwt = await new jose.SignJWT(supabasePayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('supabase')
    .sign(supabaseSecret);

  return supabaseJwt;
}

// Main function handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract token from request
    const token = extractToken(req);
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    // Verify the token
    const verified = await verifyToken(token);
    // Sign a new JWT with Supabase secret
    const supabaseJwt = await signSupabaseJwt(verified);
    return new Response(JSON.stringify({ supabaseJwt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return new Response(JSON.stringify({ error: 'Token verification failed ' + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }
});
