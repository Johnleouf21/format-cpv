import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLearnerDetails } from '@/lib/services/trainer.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const { id } = await params

    const details = await getLearnerDetails(session.user.id, id)

    return NextResponse.json(details)
  } catch (error) {
    return handleApiError(error)
  }
}
