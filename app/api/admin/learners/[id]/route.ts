import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLearnerById, deleteLearner } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { logActivity } from '@/lib/services/activity-log.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const learner = await getLearnerById(id)

    return NextResponse.json(learner)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    await deleteLearner(id)

    logActivity({
      action: 'LEARNER_DELETED',
      details: `Apprenant supprimé`,
      userId: session.user.id,
      targetId: id,
      targetType: 'user',
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
