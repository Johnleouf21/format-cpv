import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { updateAllowedEmailRole, removeAllowedEmail } from '@/lib/services/whitelist.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { updateEmailRoleSchema } from '@/lib/validations/whitelist.schema'
import { UserRole } from '@prisma/client'

export async function PUT(
  request: NextRequest,
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
    const body = await request.json()
    const { role } = updateEmailRoleSchema.parse(body)

    const updated = await updateAllowedEmailRole(id, role as UserRole)
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

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
    await removeAllowedEmail(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
