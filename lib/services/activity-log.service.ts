import { prisma } from '@/lib/db'

interface LogActivityParams {
  action: string
  details?: string
  userId?: string
  targetId?: string
  targetType?: string
}

/**
 * Enregistre une activité dans le journal.
 * Appel non-bloquant : ne lance pas d'erreur pour ne pas impacter le flow principal.
 */
export function logActivity(params: LogActivityParams) {
  prisma.activityLog
    .create({
      data: {
        action: params.action,
        details: params.details,
        userId: params.userId,
        targetId: params.targetId,
        targetType: params.targetType,
      },
    })
    .catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Activity log error:', error)
      }
    })
}

/**
 * Récupère les dernières activités pour le dashboard admin.
 */
export async function getRecentActivities(limit = 50) {
  return prisma.activityLog.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
