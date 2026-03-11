import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export async function getUserProgress(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })

  if (!user?.parcoursId) {
    throw new ApiError(404, 'Aucun parcours assigné', 'NO_PARCOURS_ASSIGNED')
  }

  const [progress, totalModules] = await Promise.all([
    prisma.progress.findMany({
      where: {
        userId,
        module: { parcoursId: user.parcoursId },
      },
      include: {
        module: {
          select: { id: true, title: true, order: true },
        },
        quizResult: {
          select: { score: true, totalQuestions: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.module.count({
      where: { parcoursId: user.parcoursId },
    }),
  ])

  return {
    completed: progress.length,
    total: totalModules,
    percentage: totalModules > 0 ? Math.round((progress.length / totalModules) * 100) : 0,
    modules: progress.map((p) => ({
      moduleId: p.module.id,
      moduleTitle: p.module.title,
      moduleOrder: p.module.order,
      completedAt: p.completedAt,
      quizScore: p.quizResult
        ? {
            score: p.quizResult.score,
            total: p.quizResult.totalQuestions,
          }
        : null,
    })),
  }
}

export async function markModuleAsCompleted(userId: string, moduleId: string) {
  // Verify module exists and user has access
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, parcoursId: true },
  })

  if (!module) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })

  if (user?.parcoursId !== module.parcoursId) {
    throw new ApiError(403, 'Accès non autorisé à ce module', 'MODULE_ACCESS_DENIED')
  }

  // Check if already completed
  const existingProgress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
  })

  if (existingProgress) {
    return { alreadyCompleted: true, progress: existingProgress }
  }

  // Create progress record
  const progress = await prisma.progress.create({
    data: {
      userId,
      moduleId,
    },
    include: {
      module: {
        select: { title: true, order: true },
      },
    },
  })

  // Find next module
  const nextModule = await prisma.module.findFirst({
    where: {
      parcoursId: module.parcoursId,
      order: { gt: progress.module.order },
    },
    orderBy: { order: 'asc' },
    select: { id: true, title: true },
  })

  return {
    alreadyCompleted: false,
    progress,
    nextModule,
  }
}
