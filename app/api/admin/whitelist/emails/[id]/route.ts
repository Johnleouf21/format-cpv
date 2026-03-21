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

    const allowedEmail = await getAllowedEmailById(id)

    // Toute modification impliquant le rôle ADMIN → Super Admin requis
    if (role === 'ADMIN' || allowedEmail?.role === 'ADMIN') {
      await requireSuperAdmin()
    } else {
      await requireAuth('ADMIN')
    }

    // Protection absolue : impossible de modifier un Super Admin
    if (allowedEmail) {
      const targetUser = await prisma.user.findUnique({
        where: { email: allowedEmail.email },
        select: { isSuperAdmin: true },
      })
      if (targetUser?.isSuperAdmin && role !== 'ADMIN') {
        throw new ApiError(403, 'Ce rôle ne peut pas être modifié', 'PROTECTED_USER')
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

    const allowedEmail = await getAllowedEmailById(id)

    // Si l'email a le rôle ADMIN dans la whitelist → Super Admin requis
    if (allowedEmail?.role === 'ADMIN') {
      await requireSuperAdmin()
    } else {
      await requireAuth('ADMIN')
    }

    // Vérifier si c'est un Super Admin (protection absolue)
    if (allowedEmail) {
      const targetUser = await prisma.user.findUnique({
        where: { email: allowedEmail.email },
        select: { isSuperAdmin: true },
      })
      if (targetUser?.isSuperAdmin) {
        throw new ApiError(403, 'Cet utilisateur ne peut pas être supprimé', 'PROTECTED_USER')
      }
    }

    await removeAllowedEmail(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
