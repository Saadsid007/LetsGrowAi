import { NextResponse } from 'next/server';

// ─── Protected routes — redirect to login if no token ────────────────────────
const PROTECTED_ROUTES = [
  '/dashboard',
  '/onboarding',
  '/settings',
];

// ─── Auth routes — redirect to dashboard if already logged in ─────────────────
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check BOTH auth systems:
  // 1. Our custom JWT cookie (email/password login)
  const customToken = request.cookies.get('auth_token')?.value;
  // 2. NextAuth session cookie (Google OAuth) — name differs by env
  const nextAuthToken =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isAuthenticated = !!(customToken || nextAuthToken);

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  // 1. Unauthenticated user trying to access a protected route
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Already logged in user trying to access login/register
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/onboarding',
    '/settings',
    '/auth/login',
    '/auth/register',
  ],
};
