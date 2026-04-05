import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export async function getParcoursWithModules(parcoursId: string, userId: string) {
  const parcours = await prisma.parcours.findUnique({
    where: { id: parcoursId },
    include: {
      parcoursModules: {
        orderBy: { order: 'asc' },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
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
      module: { parcoursModules: { some: { parcoursId } } },
    },
    select: { moduleId: true },
  })

  const completedModuleIds = new Set(progress.map((p) => p.moduleId))

  const modulesWithStatus = parcours.parcoursModules.map((pm) => ({
    id: pm.module.id,
    title: pm.module.title,
    order: pm.order,
    isCompleted: completedModuleIds.has(pm.module.id),
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
      total: parcours.parcoursModules.length,
    },
  }
}

export async function getUserParcours(userId: string, parcoursId?: string) {
  // If parcoursId provided, use it directly. Otherwise find the user's first assigned parcours.
  let targetParcoursId = parcoursId

  if (!targetParcoursId) {
    const assignment = await prisma.userParcours.findFirst({
      where: { userId },
      orderBy: { assignedAt: 'asc' },
      select: { parcoursId: true },
    })
    // Fallback: check legacy parcoursId on User
    if (!assignment) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { parcoursId: true },
      })
      targetParcoursId = user?.parcoursId || undefined
    } else {
      targetParcoursId = assignment.parcoursId
    }
  }

  if (!targetParcoursId) {
    throw new ApiError(404, 'Aucun parcours assigné', 'NO_PARCOURS_ASSIGNED')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  })

  if (!user) {
    throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND')
  }

  const parcours = await prisma.parcours.findUnique({
    where: { id: targetParcoursId },
    include: {
      parcoursModules: {
        orderBy: { order: 'asc' },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              quiz: { select: { id: true } },
            },
          },
        },
      },
    },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  // Get user's progress with quiz results
  const progress = await prisma.progress.findMany({
    where: {
      userId,
      module: { parcoursModules: { some: { parcoursId: targetParcoursId } } },
    },
    select: {
      moduleId: true,
      quizResult: {
        select: { score: true, totalQuestions: true },
      },
    },
  })

  const progressMap = new Map(progress.map((p) => [p.moduleId, p]))

  const modulesWithStatus = parcours.parcoursModules.map((pm) => {
    const moduleProgress = progressMap.get(pm.module.id)
    return {
      id: pm.module.id,
      title: pm.module.title,
      order: pm.order,
      isCompleted: !!moduleProgress,
      hasQuiz: !!pm.module.quiz,
      quizScore: moduleProgress?.quizResult
        ? {
            score: moduleProgress.quizResult.score,
            total: moduleProgress.quizResult.totalQuestions,
          }
        : null,
    }
  })

  const nextModule = modulesWithStatus.find((m) => !m.isCompleted) || null

  return {
    user: { id: user.id, name: user.name, email: user.email },
    parcours: { id: parcours.id, title: parcours.title, description: parcours.description },
    modules: modulesWithStatus,
    progress: { completed: progress.length, total: parcours.parcoursModules.length },
    nextModule,
  }
}

export async function getUserParcoursAssignments(userId: string) {
  const assignments = await prisma.userParcours.findMany({
    where: { userId },
    include: {
      parcours: {
        include: {
          parcoursModules: { select: { moduleId: true } },
        },
      },
    },
    orderBy: { assignedAt: 'asc' },
  })

  // Fallback: if no UserParcours but user has legacy parcoursId
  if (assignments.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        parcours: {
          include: { parcoursModules: { select: { moduleId: true } } },
        },
      },
    })
    if (user?.parcours) {
      const progress = await prisma.progress.findMany({
        where: { userId, module: { parcoursModules: { some: { parcoursId: user.parcours.id } } } },
        select: { moduleId: true },
      })
      return [{
        id: user.parcours.id,
        title: user.parcours.title,
        totalModules: user.parcours.parcoursModules.length,
        completedModules: progress.length,
      }]
    }
    return []
  }

  const progress = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true },
  })
  const completedModuleIds = new Set(progress.map((p) => p.moduleId))

  return assignments.map((a) => ({
    id: a.parcours.id,
    title: a.parcours.title,
    totalModules: a.parcours.parcoursModules.length,
    completedModules: a.parcours.parcoursModules.filter((pm) => completedModuleIds.has(pm.moduleId)).length,
  }))
}
