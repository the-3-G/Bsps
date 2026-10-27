import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>503 Service Temporarily Unavailable</title></head>
<body style="font-family: system-ui, sans-serif; background-color: #fff; color: #111; margin-top: 50px;">
<center><h1>503 Service Temporarily Unavailable</h1></center>
<hr style="max-width: 600px; border: none; border-top: 1px solid #ccc;"><center><small>nginx</small></center>
</body>
</html>`,
    {
      status: 503,
      statusText: 'Service Temporarily Unavailable',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Retry-After': '3600',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    }
  );
}

export const config = {
  matcher: ['/:path*'],
};
