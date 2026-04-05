import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { checkAndAwardBadges } from './badge.service'

export async function getUserProgress(userId: string, parcoursId?: string) {
  // Determine which parcours to get progress for
  let targetParcoursId = parcoursId

  if (!targetParcoursId) {
    // Try UserParcours first
    const assignment = await prisma.userParcours.findFirst({
      where: { userId },
      orderBy: { assignedAt: 'asc' },
      select: { parcoursId: true },
    })
    if (assignment) {
      targetParcoursId = assignment.parcoursId
    } else {
      // Fallback: legacy parcoursId
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { parcoursId: true },
      })
      targetParcoursId = user?.parcoursId || undefined
    }
  }

  if (!targetParcoursId) {
    throw new ApiError(404, 'Aucun parcours assigné', 'NO_PARCOURS_ASSIGNED')
  }

  // Get the module IDs in this parcours via ParcoursModule
  const parcoursModules = await prisma.parcoursModule.findMany({
    where: { parcoursId: targetParcoursId },
    orderBy: { order: 'asc' },
    select: { moduleId: true, order: true },
  })
  const parcoursModuleIds = parcoursModules.map((pm) => pm.moduleId)
  const orderByModuleId = new Map(parcoursModules.map((pm) => [pm.moduleId, pm.order]))

  const progress = await prisma.progress.findMany({
    where: {
      userId,
      moduleId: { in: parcoursModuleIds },
    },
    include: {
      module: {
        select: { id: true, title: true },
      },
      quizResult: {
        select: { score: true, totalQuestions: true },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  return {
    completed: progress.length,
    total: parcoursModuleIds.length,
    percentage: parcoursModuleIds.length > 0 ? Math.round((progress.length / parcoursModuleIds.length) * 100) : 0,
    modules: progress.map((p) => ({
      moduleId: p.module.id,
      moduleTitle: p.module.title,
      moduleOrder: orderByModuleId.get(p.module.id) ?? 0,
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

export async function markModuleAsCompleted(userId: string, moduleId: string, startedAt?: string) {
  // Verify module exists and user has access
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      minDuration: true,
      parcoursModules: {
        select: { parcoursId: true, order: true },
      },
    },
  })

  if (!module) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  // Use first parcoursModule as context
  const pm = module.parcoursModules[0]
  if (!pm) {
    throw new ApiError(404, 'Module non associé à un parcours', 'MODULE_NOT_FOUND')
  }

  const parcoursId = pm.parcoursId
  const moduleOrder = pm.order

  // Check access via UserParcours
  const hasAccess = await prisma.userParcours.findUnique({
    where: { userId_parcoursId: { userId, parcoursId } },
  })

  if (!hasAccess) {
    // Fallback: legacy parcoursId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { parcoursId: true },
    })
    if (user?.parcoursId !== parcoursId) {
      throw new ApiError(403, 'Accès non autorisé à ce module', 'MODULE_ACCESS_DENIED')
    }
  }

  // Validate minimum duration
  if (module.minDuration && module.minDuration > 0 && startedAt) {
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
    const required = module.minDuration * 60 * 0.9 // 10% tolerance
    if (elapsed < required) {
      throw new ApiError(400, 'Temps minimum non atteint pour ce module', 'MIN_DURATION_NOT_MET')
    }
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
        select: { title: true },
      },
    },
  })

  // Find next module via ParcoursModule
  const nextPM = await prisma.parcoursModule.findFirst({
    where: {
      parcoursId,
      order: { gt: moduleOrder },
    },
    orderBy: { order: 'asc' },
    include: { module: { select: { id: true, title: true } } },
  })

  // Check and award badges (fire-and-forget)
  checkAndAwardBadges(userId).catch(() => {})

  return {
    alreadyCompleted: false,
    progress,
    nextModule: nextPM ? { id: nextPM.module.id, title: nextPM.module.title } : null,
  }
}
