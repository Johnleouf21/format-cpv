import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserXP } from '@/lib/services/xp.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    const xp = await getUserXP(session.user.id)
    return NextResponse.json(xp)
  } catch (error) {
    return handleApiError(error)
  }
}
