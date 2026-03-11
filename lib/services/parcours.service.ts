import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export async function getParcoursWithModules(parcoursId: string, userId: string) {
  const parcours = await prisma.parcours.findUnique({
    where: { id: parcoursId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  // Get user's progress for this parcours
  const progress = await prisma.progress.findMany({
    where: {
      userId,
      module: { parcoursId },
    },
    select: { moduleId: true },
  })

  const completedModuleIds = new Set(progress.map((p) => p.moduleId))

  const modulesWithStatus = parcours.modules.map((module) => ({
    ...module,
    isCompleted: completedModuleIds.has(module.id),
  }))

  return {
    parcours: {
      id: parcours.id,
      title: parcours.title,
      description: parcours.description,
    },
    modules: modulesWithStatus,
    progress: {
      completed: completedModuleIds.size,
      total: parcours.modules.length,
    },
  }
}

export async function getUserParcours(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      parcours: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              quiz: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  })

  if (!user?.parcours) {
    throw new ApiError(404, 'Aucun parcours assigné', 'NO_PARCOURS_ASSIGNED')
  }

  // Get user's progress with quiz results
  const progress = await prisma.progress.findMany({
    where: {
      userId,
      module: { parcoursId: user.parcours.id },
    },
    select: {
      moduleId: true,
      quizResult: {
        select: {
          score: true,
          totalQuestions: true,
        },
      },
    },
  })

  const progressMap = new Map(
    progress.map((p) => [p.moduleId, p])
  )

  const modulesWithStatus = user.parcours.modules.map((module) => {
    const moduleProgress = progressMap.get(module.id)
    return {
      id: module.id,
      title: module.title,
      order: module.order,
      isCompleted: !!moduleProgress,
      hasQuiz: !!module.quiz,
      quizScore: moduleProgress?.quizResult
        ? {
            score: moduleProgress.quizResult.score,
            total: moduleProgress.quizResult.totalQuestions,
          }
        : null,
    }
  })

  // Find next module to continue
  const nextModule = modulesWithStatus.find((m) => !m.isCompleted) || null

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    parcours: {
      id: user.parcours.id,
      title: user.parcours.title,
      description: user.parcours.description,
    },
    modules: modulesWithStatus,
    progress: {
      completed: progress.length,
      total: user.parcours.modules.length,
    },
    nextModule,
  }
}
