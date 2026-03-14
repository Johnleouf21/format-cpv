import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markModuleAsCompleted } from '@/lib/services/progress.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

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

    return NextResponse.json(result, { status: result.alreadyCompleted ? 200 : 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
