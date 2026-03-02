
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth-permissions'; // Note: getCurrentUser in middleware might be tricky due to cookie parsing, usually we check cookie existence or decode JWT manually in middleware for speed
// But since getCurrentUser uses `cookies()` from next/headers, it might work or fail depending on Next.js version in middleware context.
// In Next.js middleware, we usually use `request.cookies`.
// For simplicity, let's do a basic check here or use a lightweight auth check.

export async function middleware(request: NextRequest) {
  // 1. Maintenance Mode
  // Read from env or config
  // Note: Env vars in middleware are supported
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  
  if (isMaintenance) {
    // Allow access to maintenance page and static assets
    if (!request.nextUrl.pathname.startsWith('/maintenance') && 
        !request.nextUrl.pathname.startsWith('/_next') && 
        !request.nextUrl.pathname.startsWith('/static')) {
        
        // Check if user is SUPERADMIN to bypass?
        // Reading cookies to bypass maintenance
        const bypassCookie = request.cookies.get('maintenance_bypass');
        if (bypassCookie?.value !== process.env.MAINTENANCE_BYPASS_TOKEN) {
             return NextResponse.redirect(new URL('/maintenance', request.url));
        }
    }
  }

  // Allow access if maintenance is OFF or bypassed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
