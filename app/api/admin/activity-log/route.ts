import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getRecentActivities } from '@/lib/services/activity-log.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const activities = await getRecentActivities(100)
    return NextResponse.json(activities)
  } catch (error) {
    return handleApiError(error)
  }
}
