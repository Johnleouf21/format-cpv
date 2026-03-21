import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getTrainerStats } from '@/lib/services/trainer.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const stats = await getTrainerStats(session.user.id)

    const response = NextResponse.json(stats)
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
