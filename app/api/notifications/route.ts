import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getUserNotifications, getUnreadCount, markAllAsRead } from '@/lib/services/notification.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await requireAuth()

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id),
      getUnreadCount(session.user.id),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return handleApiError(error)
  }
}

// Marquer toutes comme lues
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json().catch(() => ({}))

    if (body.action === 'mark_all_read') {
      await markAllAsRead(session.user.id)
      return NextResponse.json({ success: true })
    }

    throw new ApiError(400, 'Action invalide', 'INVALID_ACTION')
  } catch (error) {
    return handleApiError(error)
  }
}
