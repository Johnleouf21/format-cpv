import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { addUsersBulk } from '@/lib/services/user-management.service'
import { addUsersBulkSchema } from '@/lib/validations/user-management.schema'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const body = await request.json()
    const data = addUsersBulkSchema.parse(body)

    // TRAINER: vérifier que tous les emails existent déjà
    if (session.user.role === 'TRAINER') {
      const existingUsers = await prisma.user.findMany({
        where: { email: { in: data.emails } },
        select: { email: true },
      })
      const existingEmails = new Set(existingUsers.map((u) => u.email))
      const newEmails = data.emails.filter((e) => !existingEmails.has(e))
      if (newEmails.length > 0) {
        throw new ApiError(403, `Impossible d'ajouter des utilisateurs inexistants : ${newEmails.join(', ')}. Contactez votre administrateur.`, 'TRAINER_CANNOT_CREATE')
      }
    }

    const results = await addUsersBulk({
      ...data,
      trainerId: session.user.role === 'TRAINER' ? session.user.id : body.trainerId || session.user.id,
      addedBy: session.user.id,
      addedByName: session.user.name || undefined,
    })

    const created = results.filter((r) => r.isNew && r.success).length
    const existing = results.filter((r) => !r.isNew && r.success).length
    const failed = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      created,
      existing,
      failed,
      results,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
