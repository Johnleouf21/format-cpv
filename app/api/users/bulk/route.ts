import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { addUsersBulk } from '@/lib/services/user-management.service'
import { addUsersBulkSchema } from '@/lib/validations/user-management.schema'
import { handleApiError } from '@/lib/errors/api-error'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const body = await request.json()
    const data = addUsersBulkSchema.parse(body)

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
