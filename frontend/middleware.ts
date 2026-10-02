import { NextRequest, NextResponse } from 'next/server'

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
]

const PROTECTED_ROUTES = [
  '/dashboard',
  '/outreach',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const refreshToken = request.cookies.get('refreshToken')?.value

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route),
  )

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  )

  // Нет refresh token → нельзя в dashboard
  if (!refreshToken && isProtectedRoute) {
    return NextResponse.redirect(
      new URL('/auth/login', request.url),
    )
  }

  // Есть refresh token → нельзя на login/register
  if (refreshToken && isAuthRoute) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url),
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/outreach/:path*',
    '/auth/:path*',
  ],
}