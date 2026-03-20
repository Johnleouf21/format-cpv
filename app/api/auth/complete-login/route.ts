import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkRateLimit } from '@/lib/utils/rate-limit'

export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit(request, 'complete-login', { maxRequests: 10, windowSeconds: 60 })
  if (rateLimited) return rateLimited
  const pendingId = request.nextUrl.searchParams.get('pendingId')

  if (pendingId) {
    try {
      await prisma.pendingLogin.update({
        where: { id: pendingId },
        data: { verified: true },
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error completing login:', error)
    }
  }

  // Redirect to a "you can close this tab" page
  return NextResponse.redirect(new URL('/login/complete', request.url))
}
