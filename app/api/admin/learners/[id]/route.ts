import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isSuperAdmin } from '@/lib/auth/require-auth'
import { getLearnerById, deleteLearner } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { logActivity } from '@/lib/services/activity-log.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth('ADMIN')

    const { id } = await params
    const learner = await getLearnerById(id)

    return NextResponse.json(learner)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN')

    const { id } = await params

    // Empêcher la suppression d'un Super Admin
    if (await isSuperAdmin(id)) {
      throw new ApiError(403, 'Impossible de supprimer un Super Admin', 'CANNOT_DELETE_SUPER_ADMIN')
    }

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
