import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { removeAllowedDomain } from '@/lib/services/whitelist.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    await removeAllowedDomain(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
