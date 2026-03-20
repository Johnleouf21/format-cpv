import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'

export interface LearnerParcoursDetail {
  id: string
  title: string
  completed: number
  total: number
  percentage: number
}

export interface LearnerWithDetails {
  id: string
  name: string
  email: string
  trainer: {
    id: string
    name: string
    email: string
  } | null
  center: {
    id: string
    name: string
  } | null
  parcours: LearnerParcoursDetail[]
  progress: {
    completed: number
    total: number
    percentage: number
  }
  createdAt: Date
}

export interface GetLearnersOptions {
  trainerId?: string
  parcoursId?: string
  status?: 'all' | 'active' | 'completed' | 'not_started'
}

export async function getLearners(options?: GetLearnersOptions): Promise<LearnerWithDetails[]> {
  const learners = await prisma.user.findMany({
    where: {
      userParcours: { some: options?.parcoursId ? { parcoursId: options.parcoursId } : {} },
      ...(options?.trainerId && { trainerId: options.trainerId }),
    },
    include: {
      trainer: {
        select: { id: true, name: true, email: true },
      },
      center: {
        select: { id: true, name: true },
      },
      userParcours: {
        include: {
          parcours: {
            select: {
              id: true,
              title: true,
              modules: {
                select: { id: true },
              },
            },
          },
        },
      },
      progress: {
        select: { id: true, moduleId: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result: LearnerWithDetails[] = []

  for (const learner of learners) {
    const completedModuleIds = new Set(learner.progress.map((p) => p.moduleId))

    const parcoursDetails: LearnerParcoursDetail[] = learner.userParcours.map((up) => {
      const totalModules = up.parcours.modules.length
      const completed = up.parcours.modules.filter((m) => completedModuleIds.has(m.id)).length
      const percentage = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0
      return {
        id: up.parcours.id,
        title: up.parcours.title,
        completed,
        total: totalModules,
        percentage,
      }
    })

    const totalModules = parcoursDetails.reduce((sum, p) => sum + p.total, 0)
    const totalCompleted = parcoursDetails.reduce((sum, p) => sum + p.completed, 0)
    const globalPercentage = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0

    if (options?.status && options.status !== 'all') {
      if (options.status === 'completed' && globalPercentage !== 100) continue
      if (options.status === 'not_started' && totalCompleted !== 0) continue
      if (options.status === 'active' && (totalCompleted === 0 || globalPercentage === 100)) continue
    }

    result.push({
      id: learner.id,
      name: learner.name,
      email: learner.email,
      trainer: learner.trainer,
      center: learner.center,
      parcours: parcoursDetails,
      progress: {
        completed: totalCompleted,
        total: totalModules,
        percentage: globalPercentage,
      },
      createdAt: learner.createdAt,
    })
  }

  return result
}

export async function getLearnerById(id: string) {
  const learner = await prisma.user.findFirst({
    where: { id, userParcours: { some: {} } },
    include: {
      trainer: {
        select: { id: true, name: true, email: true },
      },
      parcours: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true },
          },
        },
      },
      progress: {
        include: {
          module: {
            select: { id: true, title: true },
          },
          quizResult: {
            select: { score: true, totalQuestions: true },
          },
        },
      },
    },
  })

  if (!learner) {
    throw new ApiError(404, 'Apprenant non trouvé', 'LEARNER_NOT_FOUND')
  }

  return learner
}

export async function reassignLearner(learnerId: string, newTrainerId: string) {
  const learner = await prisma.user.findFirst({
    where: { id: learnerId, userParcours: { some: {} } },
  })

  if (!learner) {
    throw new ApiError(404, 'Apprenant non trouvé', 'LEARNER_NOT_FOUND')
  }

  const trainer = await prisma.user.findFirst({
    where: { id: newTrainerId, role: { in: [UserRole.TRAINER, UserRole.ADMIN] } },
  })

  if (!trainer) {
    throw new ApiError(404, 'Formateur non trouvé', 'TRAINER_NOT_FOUND')
  }

  const updated = await prisma.user.update({
    where: { id: learnerId },
    data: { trainerId: newTrainerId },
    include: {
      trainer: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return updated
}

export async function deleteLearner(id: string) {
  const existing = await prisma.user.findFirst({
    where: { id, userParcours: { some: {} } },
  })

  if (!existing) {
    throw new ApiError(404, 'Apprenant non trouvé', 'LEARNER_NOT_FOUND')
  }

  await prisma.user.delete({
    where: { id },
  })
}
