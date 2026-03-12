import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { removeUser, updateUserRole } from '@/lib/services/user-management.service'
import { updateUserRoleSchema } from '@/lib/validations/user-management.schema'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role === 'LEARNER') throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')

    const { id } = await params

    // Cannot delete yourself
    if (id === session.user.id) {
      throw new ApiError(400, 'Vous ne pouvez pas supprimer votre propre compte', 'SELF_DELETE')
    }

    // TRAINER can only delete their own learners
    if (session.user.role === 'TRAINER') {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user || user.trainerId !== session.user.id) {
        throw new ApiError(403, 'Vous ne pouvez supprimer que vos propres apprenants', 'FORBIDDEN')
      }
    }

    await removeUser(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role === 'LEARNER') throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')

    const { id } = await params
    const body = await request.json()
    const { role } = updateUserRoleSchema.parse(body)

    const updated = await updateUserRole(id, role as UserRole, session.user.role as UserRole)
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
