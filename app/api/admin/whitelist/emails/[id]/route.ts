import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { updateAllowedEmailRole, removeAllowedEmail } from '@/lib/services/whitelist.service'
import { handleApiError } from '@/lib/errors/api-error'
import { updateEmailRoleSchema } from '@/lib/validations/whitelist.schema'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth('ADMIN')

    const { id } = await params
    const body = await request.json()
    const { role } = updateEmailRoleSchema.parse(body)

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
    await requireAuth('ADMIN')

    const { id } = await params
    await removeAllowedEmail(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
