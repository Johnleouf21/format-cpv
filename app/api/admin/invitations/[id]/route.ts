import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deleteInvitation } from '@/lib/services/invitation.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const { id } = await params

    const result = await deleteInvitation(session.user.id, id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
