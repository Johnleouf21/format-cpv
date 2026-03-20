import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getRecentActivities } from '@/lib/services/activity-log.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }
    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const activities = await getRecentActivities(100)
    return NextResponse.json(activities)
  } catch (error) {
    return handleApiError(error)
  }
}
