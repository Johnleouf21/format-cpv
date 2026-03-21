import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import {
  getUserNotifications,
  getUnreadCount,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getAllNotifications,
} from '@/lib/services/notification.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') // 'all' for full list, default for bell popover
    const filter = searchParams.get('filter') // 'unread', 'read', or null for all
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = 20

    if (mode === 'all') {
      const readFilter = filter === 'unread' ? false : filter === 'read' ? true : undefined
      const { notifications, total } = await getAllNotifications(session.user.id, {
        read: readFilter,
        limit,
        offset: (page - 1) * limit,
      })
      const unreadCount = await getUnreadCount(session.user.id)
      return NextResponse.json({ notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) })
    }

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, 5),
      getUnreadCount(session.user.id),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return handleApiError(error)
  }
}

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id === 'all') {
      await deleteAllNotifications(session.user.id)
      return NextResponse.json({ success: true })
    }

    if (id) {
      await deleteNotification(id, session.user.id)
      return NextResponse.json({ success: true })
    }

    throw new ApiError(400, 'ID requis', 'MISSING_ID')
  } catch (error) {
    return handleApiError(error)
  }
}
