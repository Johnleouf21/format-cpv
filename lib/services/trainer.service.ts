import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export interface TrainerStats {
  totalInvited: number
  totalConnected: number
  avgCompletion: number
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

export async function getTrainerStats(trainerId: string): Promise<TrainerStats> {
  // Run all queries in parallel
  const [totalInvited, totalConnected, learners] = await Promise.all([
    // Count total invitations created by this trainer
    prisma.invitation.count({
      where: { trainerId },
    }),
    // Count used invitations (connected learners)
    prisma.invitation.count({
      where: {
        trainerId,
        usedAt: { not: null },
      },
    }),
    // Get learners with their parcours modules and progress
    prisma.user.findMany({
      where: { trainerId },
      include: {
        parcours: {
          include: {
            modules: { select: { id: true } },
          },
        },
        progress: { select: { moduleId: true } },
      },
    }),
  ])

  // Calculate average completion from fetched data
  let totalCompletionPercentage = 0
  let learnerCount = 0

  for (const learner of learners) {
    if (!learner.parcours) continue

    const totalModules = learner.parcours.modules.length
    if (totalModules === 0) continue

    const parcoursModuleIds = new Set(learner.parcours.modules.map((m) => m.id))
    const completedCount = learner.progress.filter((p) =>
      parcoursModuleIds.has(p.moduleId)
    ).length

    totalCompletionPercentage += (completedCount / totalModules) * 100
    learnerCount++
  }

  const avgCompletion =
    learnerCount > 0 ? Math.round(totalCompletionPercentage / learnerCount) : 0

  return {
    totalInvited,
    totalConnected,
    avgCompletion,
  }
}

export async function getTrainerLearners(
  trainerId: string,
  options?: {
    parcoursId?: string
    status?: 'all' | 'active' | 'completed' | 'not_started'
  }
): Promise<LearnerWithProgress[]> {
  // Get learners with their parcours and progress in a single query
  const learners = await prisma.user.findMany({
    where: {
      trainerId,
      ...(options?.parcoursId && { parcoursId: options.parcoursId }),
    },
    include: {
      parcours: {
        include: {
          modules: {
            select: { id: true },
          },
        },
      },
      progress: true, // Get all progress to count completed modules
    },
    orderBy: { createdAt: 'desc' },
  })

  const learnersWithProgress: LearnerWithProgress[] = []

  for (const learner of learners) {
    const totalModules = learner.parcours?.modules?.length || 0
    const parcoursModuleIds = new Set(
      learner.parcours?.modules?.map((m) => m.id) || []
    )

    // Count completed modules from the already fetched progress data
    const completedCount = learner.progress.filter((p) =>
      parcoursModuleIds.has(p.moduleId)
    ).length

    const percentage =
      totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0

    // Filter by status if provided
    if (options?.status && options.status !== 'all') {
      if (options.status === 'completed' && percentage !== 100) continue
      if (options.status === 'not_started' && completedCount !== 0) continue
      if (
        options.status === 'active' &&
        (completedCount === 0 || percentage === 100)
      )
        continue
    }

    // Get last activity from progress
    const sortedProgress = [...learner.progress].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )

    learnersWithProgress.push({
      id: learner.id,
      name: learner.name,
      email: learner.email,
      parcours: learner.parcours
        ? {
            id: learner.parcours.id,
            title: learner.parcours.title,
          }
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
  trainerId: string,
  learnerId: string
) {
  const learner = await prisma.user.findFirst({
    where: {
      id: learnerId,
      trainerId, // Ensure trainer owns this learner
    },
    include: {
      parcours: {
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

  const modulesWithProgress =
    learner.parcours?.modules.map((module) => {
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
    parcours: learner.parcours
      ? {
          id: learner.parcours.id,
          title: learner.parcours.title,
          description: learner.parcours.description,
        }
      : null,
    modules: modulesWithProgress,
    progress: {
      completed: learner.progress.length,
      total: learner.parcours?.modules.length || 0,
      percentage:
        learner.parcours?.modules.length
          ? Math.round(
              (learner.progress.length / learner.parcours.modules.length) * 100
            )
          : 0,
    },
  }
}
