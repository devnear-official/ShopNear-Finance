import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, verifyAccessToken } from '@/server/auth/jwt';

// Public pages that don't require authentication
const AUTH_PAGES = ['/login', '/forgot-password', '/reset-password'];

// Static and public asset paths
const PUBLIC_FILE_EXTENSIONS = /\.(.*)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files, Next.js internal files, favicon, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    PUBLIC_FILE_EXTENSIONS.test(pathname)
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const hasPotentialSession = Boolean(accessToken || refreshToken);
  let isAuthenticated = false;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      isAuthenticated = true;
    }
  } else if (refreshToken) {
    // Has refresh token; let through to page where SSR/guards can refresh tokens
    isAuthenticated = true;
  }

  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  // If user is authenticated and tries to visit /login, redirect to /dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not authenticated and root path or protected route, redirect to /login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If root "/" and authenticated, redirect to /dashboard
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
