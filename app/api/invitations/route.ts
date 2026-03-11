import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createInvitation, getTrainerInvitations } from '@/lib/services/invitation.service'
import { createInvitationSchema } from '@/lib/validations/invitation.schema'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const invitations = await getTrainerInvitations(session.user.id)
    return NextResponse.json(invitations)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const body = await request.json()
    const data = createInvitationSchema.parse(body)

    const invitations = await createInvitation(session.user.id, data)
    return NextResponse.json(invitations, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
