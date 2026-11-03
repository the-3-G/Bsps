import { NextResponse, NextRequest } from 'next/server';

/**
 * Next.js Middleware — Route Protection, Hostname Isolation & Security Headers
 *
 * - revenue.bspdsys.com: Dedicated Partner Revenue Portal (rewrites '/' -> '/revenue', blocks '/admin/*')
 * - admin.bspdsys.com: Standard Admin Portal (blocks '/revenue' so regular admins cannot access it)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get('host') || '').toLowerCase();
  const isRevenueDomain = host.startsWith('revenue.');
  const isAdminDomain = host.startsWith('admin.');

  // 1. Dedicated Partner Revenue Subdomain (revenue.bspdsys.com)
  if (isRevenueDomain) {
    // Allow API routes and Next static assets
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return NextResponse.next();
    }

    // Rewrite root '/' to '/revenue'
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/revenue';
      const response = NextResponse.rewrite(url);
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      return response;
    }

    // Block /admin or /login on revenue.bspdsys.com -> redirect to '/'
    if (!pathname.startsWith('/revenue')) {
      const rootUrl = new URL('/', request.url);
      return NextResponse.redirect(rootUrl);
    }
  }

  // 2. Standard Admin Subdomain (admin.bspdsys.com) -> Hide /revenue completely
  if (isAdminDomain && pathname.startsWith('/revenue')) {
    const consoleUrl = new URL('/admin/console', request.url);
    return NextResponse.redirect(consoleUrl);
  }

  // 3. Protect /admin paths for UI navigation
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('__session');
    if (!adminToken) {
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
