import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { reassignLearner } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const reassignSchema = z.object({
  trainerId: z.string().uuid('ID de formateur invalide'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth('ADMIN')

    const { id } = await params
    const body = await request.json()
    const { trainerId } = reassignSchema.parse(body)

    const learner = await reassignLearner(id, trainerId)

    return NextResponse.json(learner)
  } catch (error) {
    return handleApiError(error)
  }
}
