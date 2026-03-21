import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireSuperAdmin } from '@/lib/auth/require-auth'
import { updateAllowedEmailRole, removeAllowedEmail, getAllowedEmailById } from '@/lib/services/whitelist.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { updateEmailRoleSchema } from '@/lib/validations/whitelist.schema'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role } = updateEmailRoleSchema.parse(body)

    // Promouvoir en ADMIN → Super Admin requis
    if (role === 'ADMIN') {
      await requireSuperAdmin()
    } else {
      await requireAuth('ADMIN')
    }

    // Empêcher la rétrogradation d'un Super Admin
    const allowedEmail = await getAllowedEmailById(id)
    if (allowedEmail) {
      const targetUser = await prisma.user.findUnique({
        where: { email: allowedEmail.email },
        select: { isSuperAdmin: true },
      })
      if (targetUser?.isSuperAdmin && role !== 'ADMIN') {
        throw new ApiError(403, 'Impossible de rétrograder un Super Admin', 'CANNOT_DEMOTE_SUPER_ADMIN')
      }
    }

    const updated = await updateAllowedEmailRole(id, role as UserRole)

    // Sync User.role if a user with this email exists
    await prisma.user.updateMany({
      where: { email: updated.email },
      data: { role: role as UserRole },
    })

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
    const { id } = await params

    // Vérifier si l'email est celui d'un Super Admin
    const allowedEmail = await getAllowedEmailById(id)
    if (allowedEmail) {
      const targetUser = await prisma.user.findUnique({
        where: { email: allowedEmail.email },
        select: { id: true, isSuperAdmin: true },
      })
      if (targetUser?.isSuperAdmin) {
        throw new ApiError(403, 'Impossible de supprimer un Super Admin', 'CANNOT_DELETE_SUPER_ADMIN')
      }
      // Supprimer un ADMIN → Super Admin requis
      if (targetUser) {
        const isAdmin = await prisma.user.findUnique({
          where: { id: targetUser.id },
          select: { role: true },
        })
        if (isAdmin?.role === 'ADMIN') {
          await requireSuperAdmin()
        } else {
          await requireAuth('ADMIN')
        }
      } else {
        await requireAuth('ADMIN')
      }
    } else {
      await requireAuth('ADMIN')
    }

    await removeAllowedEmail(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
