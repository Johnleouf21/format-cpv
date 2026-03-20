import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getUserProgress } from '@/lib/services/progress.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await requireAuth()

    const result = await getUserProgress(session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
