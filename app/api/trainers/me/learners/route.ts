import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTrainerLearners } from '@/lib/services/trainer.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const { searchParams } = new URL(request.url)
    const parcoursId = searchParams.get('parcoursId') || undefined
    const status = searchParams.get('status') as
      | 'all'
      | 'active'
      | 'completed'
      | 'not_started'
      | undefined

    const learners = await getTrainerLearners(session.user.id, {
      parcoursId,
      status,
    })

    return NextResponse.json({ learners })
  } catch (error) {
    return handleApiError(error)
  }
}
