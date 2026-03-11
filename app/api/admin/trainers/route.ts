import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTrainers, addTrainer } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const addTrainerSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const trainers = await getTrainers()

    return NextResponse.json(trainers)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const body = await request.json()
    const { email, name } = addTrainerSchema.parse(body)

    const trainer = await addTrainer(email, name)

    return NextResponse.json(trainer, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
