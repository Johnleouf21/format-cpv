import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getTrainerLearners } from '@/lib/services/trainer.service'
import { handleApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { searchParams } = new URL(request.url)
    const parcoursId = searchParams.get('parcoursId') || undefined
    const status = searchParams.get('status') as
      | 'all'
      | 'active'
      | 'completed'
      | 'not_started'
      | undefined

    const learners = await getTrainerLearners(session.user.id, {
      userRole: session.user.role as UserRole,
      parcoursId,
      status,
    })

    return NextResponse.json({ learners })
  } catch (error) {
    return handleApiError(error)
  }
}
