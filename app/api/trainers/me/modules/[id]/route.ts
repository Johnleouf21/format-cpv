import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { getModuleById } from '@/lib/services/admin.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux formateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const module = await getModuleById(id)

    if (!module) {
      throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
    }

    return NextResponse.json(module)
  } catch (error) {
    return handleApiError(error)
  }
}
