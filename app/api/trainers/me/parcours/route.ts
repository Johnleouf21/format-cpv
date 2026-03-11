import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { getParcours } from '@/lib/services/admin.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux formateurs', 'FORBIDDEN')
    }

    const parcours = await getParcours()

    return NextResponse.json(parcours)
  } catch (error) {
    return handleApiError(error)
  }
}
