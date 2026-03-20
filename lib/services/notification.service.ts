import { prisma } from '@/lib/db'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  link?: string
}

/**
 * Crée une notification pour un utilisateur.
 * Appel non-bloquant.
 */
export function createNotification(params: CreateNotificationParams) {
  prisma.notification
    .create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Notification create error:', error)
      }
    })
}

/**
 * Crée une notification pour plusieurs utilisateurs.
 */
export function createNotificationBulk(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  prisma.notification
    .createMany({
      data: userIds.map((userId) => ({
        userId,
        title: params.title,
        message: params.message,
        link: params.link,
      })),
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Notification bulk create error:', error)
      }
    })
}

export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  })
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  })
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}
