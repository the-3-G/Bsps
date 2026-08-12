import { NextResponse, NextRequest } from 'next/server';

/**
 * Next.js Client Route Navigation Guard (UX Only)
 *
 * NOTE: This middleware provides user experience route redirection in static export mode.
 * Real administrative authorization is enforced 100% server-side via Firebase Auth Custom Claims
 * in Cloud Functions and Firestore Security Rules.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin paths for UI navigation
  if (pathname.startsWith('/admin')) {
    // Look for mock or auth session tokens
    const adminToken = request.cookies.get('__session');
    
    if (!adminToken) {
      // Redirect unauthenticated visitors to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
