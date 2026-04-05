import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export async function getModuleById(moduleId: string, userId: string) {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      parcoursModules: {
        select: {
          parcoursId: true,
          order: true,
          parcours: { select: { id: true, title: true } },
        },
      },
      quiz: {
        select: { id: true },
      },
    },
  })

  if (!module || !module.published) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  // Use first parcoursModule to determine parcours context
  const pm = module.parcoursModules[0]
  if (!pm) {
    throw new ApiError(404, 'Module non associé à un parcours', 'MODULE_NOT_FOUND')
  }

  const parcoursId = pm.parcoursId
  const moduleOrder = pm.order

  // Check if user has access to this module (assigned to this parcours via UserParcours)
  const hasAccess = await prisma.userParcours.findUnique({
    where: { userId_parcoursId: { userId, parcoursId } },
  })

  // Fallback: check legacy parcoursId on User
  if (!hasAccess) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { parcoursId: true },
    })
    if (user?.parcoursId !== parcoursId) {
      throw new ApiError(403, 'Accès non autorisé à ce module', 'MODULE_ACCESS_DENIED')
    }
  }

  // Check if module is completed by user
  const progress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
  })

  // Get adjacent modules for navigation via ParcoursModule
  const [previousPM, nextPM] = await Promise.all([
    prisma.parcoursModule.findFirst({
      where: {
        parcoursId,
        module: { published: true },
        order: { lt: moduleOrder },
      },
      orderBy: { order: 'desc' },
      include: { module: { select: { id: true, title: true } } },
    }),
    prisma.parcoursModule.findFirst({
      where: {
        parcoursId,
        module: { published: true },
        order: { gt: moduleOrder },
      },
      orderBy: { order: 'asc' },
      include: { module: { select: { id: true, title: true } } },
    }),
  ])

  return {
    module: {
      id: module.id,
      title: module.title,
      content: module.content,
      order: moduleOrder,
      hasQuiz: !!module.quiz,
      minDuration: module.minDuration,
    },
    parcours: pm.parcours,
    isCompleted: !!progress,
    navigation: {
      previous: previousPM ? { id: previousPM.module.id, title: previousPM.module.title, order: previousPM.order } : null,
      next: nextPM ? { id: nextPM.module.id, title: nextPM.module.title, order: nextPM.order } : null,
    },
  }
}

export async function getModulesForParcours(parcoursId: string) {
  const parcoursModules = await prisma.parcoursModule.findMany({
    where: { parcoursId, module: { published: true } },
    orderBy: { order: 'asc' },
    include: {
      module: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  return parcoursModules.map((pm) => ({
    id: pm.module.id,
    title: pm.module.title,
    order: pm.order,
  }))
}
