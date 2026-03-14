import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { UserRole } from '@prisma/client'
import { sendTrainerWelcomeEmail } from '../email.service'

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
