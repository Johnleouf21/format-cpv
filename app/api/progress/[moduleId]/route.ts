import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markModuleAsCompleted } from '@/lib/services/progress.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { logActivity } from '@/lib/services/activity-log.service'

interface RouteParams {
  params: Promise<{ moduleId: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    const { moduleId } = await params
    const body = await _request.json().catch(() => ({}))
    const result = await markModuleAsCompleted(session.user.id, moduleId, body.startedAt)

    if (!result.alreadyCompleted) {
      logActivity({
        action: 'MODULE_COMPLETED',
        details: `Module terminé`,
        userId: session.user.id,
        targetId: moduleId,
        targetType: 'module',
      })
    }

    return NextResponse.json(result, { status: result.alreadyCompleted ? 200 : 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
