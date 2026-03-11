import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export interface CertificateData {
  userName: string
  parcoursTitle: string
  completedAt: Date
  modulesCompleted: number
  totalModules: number
}

export async function canGenerateCertificate(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })

  if (!user?.parcoursId) {
    return false
  }

  const [completedCount, totalCount] = await Promise.all([
    prisma.progress.count({
      where: {
        userId,
        module: { parcoursId: user.parcoursId },
      },
    }),
    prisma.module.count({
      where: { parcoursId: user.parcoursId },
    }),
  ])

  return totalCount > 0 && completedCount === totalCount
}

export async function getCertificateData(
  userId: string
): Promise<CertificateData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      parcours: {
        include: {
          modules: {
            select: { id: true },
          },
        },
      },
      progress: {
        where: {
          module: {
            parcours: {
              users: {
                some: { id: userId },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: { completedAt: true },
      },
    },
  })

  if (!user || !user.parcours) {
    throw new ApiError(404, 'Utilisateur ou parcours non trouvé', 'NOT_FOUND')
  }

  const completedCount = await prisma.progress.count({
    where: {
      userId,
      module: { parcoursId: user.parcoursId! },
    },
  })

  const totalModules = user.parcours.modules.length

  if (completedCount < totalModules) {
    throw new ApiError(
      400,
      'Le parcours n\'est pas encore complété',
      'PARCOURS_NOT_COMPLETED'
    )
  }

  // Get the last completion date
  const lastProgress = await prisma.progress.findFirst({
    where: {
      userId,
      module: { parcoursId: user.parcoursId! },
    },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true },
  })

  return {
    userName: user.name,
    parcoursTitle: user.parcours.title,
    completedAt: lastProgress?.completedAt || new Date(),
    modulesCompleted: completedCount,
    totalModules,
  }
}
