import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'

export interface TrainerStats {
  totalInvited: number
  totalConnected: number
  avgCompletion: number
  distribution: {
    notStarted: number
    inProgress: number
    almostDone: number
    completed: number
  }
  atRiskLearners: {
    id: string
    name: string
    email: string
    percentage: number
    lastActivity: Date | null
  }[]
}

export interface LearnerWithProgress {
  id: string
  name: string
  email: string
  parcours: {
    id: string
    title: string
  } | null
  progress: {
    completed: number
    total: number
    percentage: number
  }
  lastActivity: Date | null
  createdAt: Date
}

// Build the where clause based on role:
// ADMIN sees all users with at least one parcours assigned (any role)
// TRAINER sees only their own assigned learners
function learnerWhereClause(userId: string, userRole: UserRole) {
  if (userRole === 'ADMIN') {
    return { userParcours: { some: {} } }
  }
  return { trainerId: userId }
}

export async function getTrainerStats(
  userId: string,
  userRole: UserRole = UserRole.TRAINER
): Promise<TrainerStats> {
  const where = learnerWhereClause(userId, userRole)

  const [totalInvited, totalConnected, learners] = await Promise.all([
    prisma.invitation.count({
      where: userRole === 'ADMIN' ? {} : { trainerId: userId },
    }),
    prisma.invitation.count({
      where: {
        ...(userRole === 'ADMIN' ? {} : { trainerId: userId }),
        usedAt: { not: null },
      },
    }),
    prisma.user.findMany({
      where,
      include: {
        userParcours: {
          include: {
            parcours: {
              include: { modules: { select: { id: true } } },
            },
          },
        },
        progress: { select: { moduleId: true, completedAt: true } },
      },
    }),
  ])

  let totalCompletionPercentage = 0
  let learnerCount = 0
  const distribution = { notStarted: 0, inProgress: 0, almostDone: 0, completed: 0 }
  const atRiskLearners: TrainerStats['atRiskLearners'] = []
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  for (const learner of learners) {
    const allModuleIds = learner.userParcours.flatMap((up) =>
      up.parcours.modules.map((m) => m.id)
    )
    const totalModules = allModuleIds.length
    if (totalModules === 0) continue

    const completedModuleIds = new Set(learner.progress.map((p) => p.moduleId))
    const completedCount = allModuleIds.filter((id) => completedModuleIds.has(id)).length

    const percentage = Math.round((completedCount / totalModules) * 100)
    totalCompletionPercentage += percentage
    learnerCount++

    // Distribution
    if (percentage === 0) distribution.notStarted++
    else if (percentage < 50) distribution.inProgress++
    else if (percentage < 100) distribution.almostDone++
    else distribution.completed++

    // At-risk: started but < 100% and no activity in 7 days
    if (percentage > 0 && percentage < 100) {
      const sortedProgress = [...learner.progress].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      const lastActivity = sortedProgress[0]?.completedAt || null
      if (!lastActivity || new Date(lastActivity) < sevenDaysAgo) {
        atRiskLearners.push({
          id: learner.id,
          name: learner.name,
          email: learner.email,
          percentage,
          lastActivity,
        })
      }
    }
  }

  const avgCompletion =
    learnerCount > 0 ? Math.round(totalCompletionPercentage / learnerCount) : 0

  return {
    totalInvited,
    totalConnected,
    avgCompletion,
    distribution,
    atRiskLearners: atRiskLearners.sort((a, b) => a.percentage - b.percentage),
  }
}

export async function getTrainerLearners(
  userId: string,
  options?: {
    userRole?: UserRole
    parcoursId?: string
    status?: 'all' | 'active' | 'completed' | 'not_started'
  }
): Promise<LearnerWithProgress[]> {
  const userRole = options?.userRole || UserRole.TRAINER
  const baseWhere = learnerWhereClause(userId, userRole)

  const where = {
    ...baseWhere,
    ...(options?.parcoursId && {
      userParcours: { some: { parcoursId: options.parcoursId } },
    }),
  }

  const learners = await prisma.user.findMany({
    where,
    include: {
      userParcours: {
        include: {
          parcours: {
            include: { modules: { select: { id: true } } },
          },
        },
      },
      progress: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const learnersWithProgress: LearnerWithProgress[] = []

  for (const learner of learners) {
    const allModuleIds = learner.userParcours.flatMap((up) =>
      up.parcours.modules.map((m) => m.id)
    )
    const totalModules = allModuleIds.length
    const completedModuleIds = new Set(learner.progress.map((p) => p.moduleId))
    const completedCount = allModuleIds.filter((id) => completedModuleIds.has(id)).length

    const percentage =
      totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

    // Filter by status if provided
    if (options?.status && options.status !== 'all') {
      if (options.status === 'completed' && percentage !== 100) continue
      if (options.status === 'not_started' && completedCount !== 0) continue
      if (options.status === 'active' && (completedCount === 0 || percentage === 100)) continue
    }

    // Get last activity from progress
    const sortedProgress = [...learner.progress].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )

    // Use first userParcours as primary parcours display
    const primaryParcours = learner.userParcours[0]?.parcours || null

    learnersWithProgress.push({
      id: learner.id,
      name: learner.name,
      email: learner.email,
      parcours: primaryParcours
        ? { id: primaryParcours.id, title: primaryParcours.title }
        : null,
      progress: {
        completed: completedCount,
        total: totalModules,
        percentage,
      },
      lastActivity: sortedProgress[0]?.completedAt || null,
      createdAt: learner.createdAt,
    })
  }

  return learnersWithProgress
}

export async function getLearnerDetails(
  userId: string,
  learnerId: string,
  userRole: UserRole = UserRole.TRAINER
) {
  // ADMIN can view any user with parcours, TRAINER only their own
  const where = userRole === 'ADMIN'
    ? { id: learnerId, userParcours: { some: {} } }
    : { id: learnerId, trainerId: userId }

  const learner = await prisma.user.findFirst({
    where,
    include: {
      userParcours: {
        include: {
          parcours: {
            include: {
              modules: {
                orderBy: { order: 'asc' },
                select: { id: true, title: true, order: true },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      },
      progress: {
        include: {
          module: {
            select: { id: true, title: true, order: true },
          },
          quizResult: {
            select: { score: true, totalQuestions: true },
          },
        },
        orderBy: { completedAt: 'desc' },
      },
    },
  })

  if (!learner) {
    throw new ApiError(404, 'Apprenant non trouvé', 'LEARNER_NOT_FOUND')
  }

  const completedModuleIds = new Set(
    learner.progress.map((p) => p.moduleId)
  )

  // Use first parcours as primary display (backward compat)
  const primaryUp = learner.userParcours[0]
  const primaryParcours = primaryUp?.parcours || null

  const modulesWithProgress =
    primaryParcours?.modules.map((module) => {
      const progress = learner.progress.find(
        (p) => p.moduleId === module.id
      )
      return {
        ...module,
        isCompleted: completedModuleIds.has(module.id),
        completedAt: progress?.completedAt || null,
        quizScore: progress?.quizResult
          ? {
              score: progress.quizResult.score,
              total: progress.quizResult.totalQuestions,
            }
          : null,
      }
    }) || []

  return {
    learner: {
      id: learner.id,
      name: learner.name,
      email: learner.email,
      createdAt: learner.createdAt,
    },
    parcours: primaryParcours
      ? {
          id: primaryParcours.id,
          title: primaryParcours.title,
          description: primaryParcours.description,
        }
      : null,
    modules: modulesWithProgress,
    progress: {
      completed: learner.progress.length,
      total: primaryParcours?.modules.length || 0,
      percentage:
        primaryParcours?.modules.length
          ? Math.round(
              (learner.progress.length / primaryParcours.modules.length) * 100
            )
          : 0,
    },
  }
}
