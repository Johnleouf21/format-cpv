import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'
import { sendTrainerWelcomeEmail } from './email.service'

// ============================================================================
// MODULES
// ============================================================================

export interface ModuleWithDetails {
  id: string
  title: string
  content: string
  order: number
  parcours: {
    id: string
    title: string
  }
  hasQuiz: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateModuleInput {
  title: string
  content: string
  parcoursId: string
  order?: number
}

export interface UpdateModuleInput {
  title?: string
  content?: string
  parcoursId?: string
  order?: number
}

export async function getModules(parcoursId?: string): Promise<ModuleWithDetails[]> {
  const where = parcoursId ? { parcoursId } : {}
  const modules = await prisma.module.findMany({
    where,
    include: {
      parcours: {
        select: { id: true, title: true },
      },
      quiz: {
        select: { id: true },
      },
    },
    orderBy: { order: 'asc' },
  })

  return modules.map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    order: m.order,
    parcours: m.parcours,
    hasQuiz: !!m.quiz,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }))
}

export async function getModuleById(id: string): Promise<ModuleWithDetails | null> {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      parcours: {
        select: { id: true, title: true },
      },
      quiz: {
        select: { id: true },
      },
    },
  })

  if (!module) return null

  return {
    id: module.id,
    title: module.title,
    content: module.content,
    order: module.order,
    parcours: module.parcours,
    hasQuiz: !!module.quiz,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  }
}

export async function createModule(input: CreateModuleInput) {
  // Verify parcours exists
  const parcours = await prisma.parcours.findUnique({
    where: { id: input.parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  // Get max order if not provided
  let order = input.order
  if (order === undefined) {
    const maxOrder = await prisma.module.aggregate({
      where: { parcoursId: input.parcoursId },
      _max: { order: true },
    })
    order = (maxOrder._max.order ?? -1) + 1
  }

  const module = await prisma.module.create({
    data: {
      title: input.title,
      content: input.content,
      parcoursId: input.parcoursId,
      order,
    },
    include: {
      parcours: {
        select: { id: true, title: true },
      },
    },
  })

  return module
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  // Check module exists
  const existing = await prisma.module.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  // If changing parcours, verify it exists
  if (input.parcoursId && input.parcoursId !== existing.parcoursId) {
    const parcours = await prisma.parcours.findUnique({
      where: { id: input.parcoursId },
    })
    if (!parcours) {
      throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
    }
  }

  const module = await prisma.module.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.parcoursId !== undefined && { parcoursId: input.parcoursId }),
      ...(input.order !== undefined && { order: input.order }),
    },
    include: {
      parcours: {
        select: { id: true, title: true },
      },
    },
  })

  return module
}

export async function deleteModule(id: string) {
  const existing = await prisma.module.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  await prisma.module.delete({
    where: { id },
  })
}

export async function reorderModules(
  parcoursId: string,
  moduleOrders: { id: string; order: number }[]
) {
  // Verify parcours exists
  const parcours = await prisma.parcours.findUnique({
    where: { id: parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  // Update all modules in transaction
  await prisma.$transaction(
    moduleOrders.map(({ id, order }) =>
      prisma.module.update({
        where: { id, parcoursId },
        data: { order },
      })
    )
  )
}

// ============================================================================
// PARCOURS
// ============================================================================

export interface ParcoursWithStats {
  id: string
  title: string
  description: string
  moduleCount: number
  learnerCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateParcoursInput {
  title: string
  description?: string
}

export interface UpdateParcoursInput {
  title?: string
  description?: string
}

export async function getParcours(): Promise<ParcoursWithStats[]> {
  const parcours = await prisma.parcours.findMany({
    include: {
      _count: {
        select: {
          modules: true,
          users: true,
        },
      },
    },
    orderBy: { title: 'asc' },
  })

  return parcours.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    moduleCount: p._count.modules,
    learnerCount: p._count.users,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))
}

export async function getParcoursById(id: string) {
  const parcours = await prisma.parcours.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          createdAt: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  return {
    ...parcours,
    learnerCount: parcours._count.users,
  }
}

export async function createParcours(input: CreateParcoursInput) {
  const parcours = await prisma.parcours.create({
    data: {
      title: input.title,
      description: input.description ?? '',
    },
  })

  return parcours
}

export async function updateParcours(id: string, input: UpdateParcoursInput) {
  const existing = await prisma.parcours.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  const parcours = await prisma.parcours.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
    },
  })

  return parcours
}

export async function deleteParcours(id: string) {
  const existing = await prisma.parcours.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  if (existing._count.users > 0) {
    throw new ApiError(
      400,
      'Impossible de supprimer un parcours avec des apprenants actifs',
      'PARCOURS_HAS_LEARNERS'
    )
  }

  await prisma.parcours.delete({
    where: { id },
  })
}

// ============================================================================
// TRAINERS
// ============================================================================

export interface TrainerWithStats {
  id: string
  name: string
  email: string
  role: UserRole
  learnerCount: number
  createdAt: Date
}

export async function getTrainers(): Promise<TrainerWithStats[]> {
  const trainers = await prisma.user.findMany({
    where: { role: { in: [UserRole.TRAINER, UserRole.ADMIN] } },
    include: {
      _count: {
        select: { learners: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return trainers.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    role: t.role,
    learnerCount: t._count.learners,
    createdAt: t.createdAt,
  }))
}

export async function getTrainerWithLearners(id: string) {
  const trainer = await prisma.user.findFirst({
    where: { id, role: { in: [UserRole.TRAINER, UserRole.ADMIN] } },
    include: {
      learners: {
        include: {
          parcours: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!trainer) {
    throw new ApiError(404, 'Formateur non trouvé', 'TRAINER_NOT_FOUND')
  }

  return trainer
}

export async function addTrainer(email: string, name?: string) {
  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    if (existing.role === UserRole.TRAINER) {
      throw new ApiError(400, 'Cet utilisateur est déjà formateur', 'ALREADY_TRAINER')
    }
    if (existing.role === UserRole.ADMIN) {
      throw new ApiError(400, 'Un administrateur ne peut pas être formateur', 'IS_ADMIN')
    }
    // Upgrade learner to trainer
    const trainer = await prisma.user.update({
      where: { email },
      data: { role: UserRole.TRAINER },
    })
    // Sync AllowedEmail
    await prisma.allowedEmail.upsert({
      where: { email: email.toLowerCase() },
      update: { role: UserRole.TRAINER },
      create: { email: email.toLowerCase(), role: UserRole.TRAINER },
    })
    return trainer
  }

  // Create new trainer
  const trainer = await prisma.user.create({
    data: {
      email,
      name: name ?? email.split('@')[0],
      role: UserRole.TRAINER,
    },
  })
  // Sync AllowedEmail
  await prisma.allowedEmail.upsert({
    where: { email: email.toLowerCase() },
    update: { role: UserRole.TRAINER },
    create: { email: email.toLowerCase(), role: UserRole.TRAINER },
  })

  // Send welcome email
  await sendTrainerWelcomeEmail({ to: email })

  return trainer
}

export async function removeTrainer(id: string) {
  const existing = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: { learners: true },
      },
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND')
  }

  if (existing.role !== UserRole.TRAINER) {
    throw new ApiError(400, 'Cet utilisateur n\'est pas formateur', 'NOT_TRAINER')
  }

  if (existing._count.learners > 0) {
    throw new ApiError(
      400,
      'Impossible de retirer le rôle formateur à un utilisateur avec des apprenants',
      'TRAINER_HAS_LEARNERS'
    )
  }

  // Downgrade to learner
  const user = await prisma.user.update({
    where: { id },
    data: { role: UserRole.LEARNER },
  })

  return user
}

// ============================================================================
// LEARNERS
// ============================================================================

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

    // Build per-parcours progress
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

    // Global progress across all parcours
    const totalModules = parcoursDetails.reduce((sum, p) => sum + p.total, 0)
    const totalCompleted = parcoursDetails.reduce((sum, p) => sum + p.completed, 0)
    const globalPercentage = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0

    // Filter by status if provided
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
  // Verify learner exists (any user with assigned parcours)
  const learner = await prisma.user.findFirst({
    where: { id: learnerId, userParcours: { some: {} } },
  })

  if (!learner) {
    throw new ApiError(404, 'Apprenant non trouvé', 'LEARNER_NOT_FOUND')
  }

  // Verify new trainer exists (TRAINER or ADMIN)
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

// ============================================================================
// ADMIN STATS
// ============================================================================

export async function getAdminStats() {
  const [totalLearners, totalTrainers, totalParcours, totalModules] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.LEARNER } }),
    prisma.user.count({ where: { role: { in: [UserRole.TRAINER, UserRole.ADMIN] } } }),
    prisma.parcours.count(),
    prisma.module.count(),
  ])

  return {
    totalLearners,
    totalTrainers,
    totalParcours,
    totalModules,
  }
}
