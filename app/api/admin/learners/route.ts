import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLearners } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get('trainerId') || undefined
    const parcoursId = searchParams.get('parcoursId') || undefined
    const status = searchParams.get('status') as 'all' | 'active' | 'completed' | 'not_started' | undefined

    const learners = await getLearners({
      trainerId,
      parcoursId,
      status: status || 'all',
    })

    return NextResponse.json(learners)
  } catch (error) {
    return handleApiError(error)
  }
}
