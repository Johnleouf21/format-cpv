import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getTrainers, addTrainer } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import { logActivity } from '@/lib/services/activity-log.service'

const addTrainerSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().optional(),
})

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const trainers = await getTrainers()

    return NextResponse.json(trainers)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN')

    const body = await request.json()
    const { email, name } = addTrainerSchema.parse(body)

    const trainer = await addTrainer(email, name)

    logActivity({
      action: 'TRAINER_ADDED',
      details: `Formateur "${name || email}" ajouté`,
      userId: session.user.id,
      targetId: trainer.id,
      targetType: 'user',
    })

    return NextResponse.json(trainer, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
