import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTrainerStats } from '@/lib/services/trainer.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const stats = await getTrainerStats(session.user.id)

    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
