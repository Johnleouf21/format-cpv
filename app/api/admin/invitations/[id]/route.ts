import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { deleteInvitation } from '@/lib/services/invitation.service'
import { handleApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { id } = await params

    const result = await deleteInvitation(session.user.id, id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
