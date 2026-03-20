import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getLearnerDetails } from '@/lib/services/trainer.service'
import { handleApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { id } = await params

    const details = await getLearnerDetails(session.user.id, id, session.user.role as UserRole)

    return NextResponse.json(details)
  } catch (error) {
    return handleApiError(error)
  }
}
