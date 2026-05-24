import { NextResponse } from 'next/server';

/**
 * Security Middleware for BRAHMO Compliance Engine
 *
 * Implements production-grade HTTP security headers and compliance controls.
 * Runs on every request in the App Router architecture.
 * 
 * NOTE: Auth is handled client-side by Supabase and AuthContext.
 * Middleware does NOT enforce auth logic to avoid conflicts.
 */
export function middleware() {
  const response = NextResponse.next();

  // ============================================================================
  // SECURITY HEADERS
  // ============================================================================

  // Prevent framing attacks - no embedding in iframes
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing - enforce declared content type
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  // strict-origin-when-cross-origin: send referrer only for same-origin requests
  // (fixes invalid "strict-no-referrer" policy warning)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  // Restrict powerful APIs available to page
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Content Security Policy
  // Strict-but-functional CSP for compliance dashboard
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline during dev
    "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://supabase.co https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Optional: Strict-Transport-Security (HTTPS only)
  // Uncomment for HTTPS environments
  // response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // ============================================================================
  // COMPLIANCE HEADERS
  // ============================================================================

  // Identify this as a compliance/audit system
  response.headers.set('X-Application', 'BRAHMO-Compliance-Engine');
  response.headers.set('X-Version', '1.0.0');

  return response;
}

/**
 * Matcher configuration
 * Apply middleware to all routes except static files
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
