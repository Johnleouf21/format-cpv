import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicRoutes = ['/login', '/invite', '/api/auth', '/api/invitations', '/api/cron']
const roleRoutes: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/trainer': ['TRAINER', 'ADMIN'],
  '/learner': ['LEARNER', 'TRAINER', 'ADMIN'],
  '/dashboard': ['LEARNER', 'TRAINER', 'ADMIN'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Add security headers
  const response = NextResponse.next()
  const isDev = process.env.NODE_ENV === 'development'

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  // CSP : unsafe-eval uniquement en dev (hot reload), unsafe-inline nécessaire pour Tailwind/Radix
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'"
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self'; frame-src https://*.sharepoint.com https://*.youtube.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com;`
  )

  // Skip auth check for public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return response
  }

  // Check authentication using JWT token (edge-compatible)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'forma-cpv.session-token',
  })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  const userRole = token.role as string
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(userRole)) {
        const redirectUrl = getDefaultRoute(userRole)
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
      break
    }
  }

  return response
}

function getDefaultRoute(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'TRAINER':
      return '/trainer'
    default:
      return '/learner'
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest|robots|public/).*)',
  ],
}
