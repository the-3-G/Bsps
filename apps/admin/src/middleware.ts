import { NextResponse, NextRequest } from 'next/server';

/**
 * Next.js Middleware — Route Protection & Security Headers
 *
 * NOTE: This middleware provides user experience route redirection.
 * Real administrative authorization is enforced 100% server-side via Firebase Auth Custom Claims
 * in Cloud Functions and Firestore Security Rules.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin paths for UI navigation
  if (pathname.startsWith('/admin')) {
    // Look for auth session token
    const adminToken = request.cookies.get('__session');
    
    if (!adminToken) {
      // Redirect unauthenticated visitors to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Apply security headers to all responses
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};

