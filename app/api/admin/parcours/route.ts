import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getParcours, createParcours } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const createParcoursSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
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

    const parcours = await getParcours()

    return NextResponse.json(parcours)
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
    const data = createParcoursSchema.parse(body)

    const parcours = await createParcours(data)

    return NextResponse.json(parcours, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
