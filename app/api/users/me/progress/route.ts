import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserProgress } from '@/lib/services/progress.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    const result = await getUserProgress(session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
