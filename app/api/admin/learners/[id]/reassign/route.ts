import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { reassignLearner } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const reassignSchema = z.object({
  trainerId: z.string().uuid('ID de formateur invalide'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const body = await request.json()
    const { trainerId } = reassignSchema.parse(body)

    const learner = await reassignLearner(id, trainerId)

    return NextResponse.json(learner)
  } catch (error) {
    return handleApiError(error)
  }
}
