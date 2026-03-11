import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export async function getModuleById(moduleId: string, userId: string) {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      parcours: {
        select: { id: true, title: true },
      },
      quiz: {
        select: { id: true },
      },
    },
  })

  if (!module) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  // Check if user has access to this module (assigned to this parcours)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })

  if (user?.parcoursId !== module.parcoursId) {
    throw new ApiError(403, 'Accès non autorisé à ce module', 'MODULE_ACCESS_DENIED')
  }

  // Check if module is completed by user
  const progress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
  })

  // Get adjacent modules for navigation
  const [previousModule, nextModule] = await Promise.all([
    prisma.module.findFirst({
      where: {
        parcoursId: module.parcoursId,
        order: { lt: module.order },
      },
      orderBy: { order: 'desc' },
      select: { id: true, title: true, order: true },
    }),
    prisma.module.findFirst({
      where: {
        parcoursId: module.parcoursId,
        order: { gt: module.order },
      },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true },
    }),
  ])

  return {
    module: {
      id: module.id,
      title: module.title,
      content: module.content,
      order: module.order,
      hasQuiz: !!module.quiz,
    },
    parcours: module.parcours,
    isCompleted: !!progress,
    navigation: {
      previous: previousModule,
      next: nextModule,
    },
  }
}

export async function getModulesForParcours(parcoursId: string) {
  return prisma.module.findMany({
    where: { parcoursId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      order: true,
    },
  })
}
