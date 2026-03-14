import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

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
