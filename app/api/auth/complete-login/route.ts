import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const pendingId = request.nextUrl.searchParams.get('pendingId')

  if (pendingId) {
    try {
      await prisma.pendingLogin.update({
        where: { id: pendingId },
        data: { verified: true },
      })
    } catch (error) {
      console.error('Error completing login:', error)
    }
  }

  // Redirect to a "you can close this tab" page
  return NextResponse.redirect(new URL('/login/complete', request.url))
}
