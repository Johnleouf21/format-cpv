import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getLearners } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get('trainerId') || undefined
    const parcoursId = searchParams.get('parcoursId') || undefined
    const status = searchParams.get('status') as 'all' | 'active' | 'completed' | 'not_started' | undefined

    const learners = await getLearners({
      trainerId,
      parcoursId,
      status: status || 'all',
    })

    return NextResponse.json(learners)
  } catch (error) {
    return handleApiError(error)
  }
}
