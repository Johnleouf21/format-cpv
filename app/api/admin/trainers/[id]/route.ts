import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getTrainerWithLearners, removeTrainer } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'
import { logActivity } from '@/lib/services/activity-log.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth('ADMIN')

    const { id } = await params
    const trainer = await getTrainerWithLearners(id)

    return NextResponse.json(trainer)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN')

    const { id } = await params
    await removeTrainer(id)

    logActivity({
      action: 'TRAINER_REMOVED',
      details: `Formateur supprimé`,
      userId: session.user.id,
      targetId: id,
      targetType: 'user',
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
