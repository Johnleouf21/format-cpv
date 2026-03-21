import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getUserXP } from '@/lib/services/xp.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await requireAuth()

    const xp = await getUserXP(session.user.id)
    const response = NextResponse.json(xp)
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
