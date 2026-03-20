import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { logActivity } from '@/lib/services/activity-log.service'

export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit(request, 'complete-login', { maxRequests: 10, windowSeconds: 60 })
  if (rateLimited) return rateLimited
  const pendingId = request.nextUrl.searchParams.get('pendingId')

  if (pendingId) {
    try {
      const pending = await prisma.pendingLogin.update({
        where: { id: pendingId },
        data: { verified: true },
      })

      logActivity({
        action: 'USER_LOGIN',
        details: `Connexion de ${pending.email}`,
        targetType: 'auth',
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error completing login:', error)
    }
  }

  // Redirect to complete page with pendingId for auto-login attempt
  const completeUrl = new URL('/login/complete', request.url)
  if (pendingId) {
    completeUrl.searchParams.set('pendingId', pendingId)
  }
  return NextResponse.redirect(completeUrl)
}
