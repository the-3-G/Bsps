import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin paths
  if (pathname.startsWith('/admin')) {
    // Look for mock or auth session tokens
    const adminToken = request.cookies.get('admin-session');
    
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
