import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export interface ModuleWithDetails {
  id: string
  title: string
  content: string
  minDuration: number
  published: boolean
  parcoursModules: {
    parcoursId: string
    order: number
    parcours: { id: string; title: string }
  }[]
  hasQuiz: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateModuleInput {
  title: string
  content: string
  parcoursIds: string[]
  minDuration?: number
  published?: boolean
}

export interface UpdateModuleInput {
  title?: string
  content?: string
  parcoursIds?: string[]
  minDuration?: number
  published?: boolean
}

export async function getModules(parcoursId?: string): Promise<ModuleWithDetails[]> {
  if (parcoursId) {
    // Query via ParcoursModule pivot to get modules for a specific parcours
    const parcoursModules = await prisma.parcoursModule.findMany({
      where: { parcoursId },
      orderBy: { order: 'asc' },
      include: {
        module: {
          include: {
            quiz: { select: { id: true } },
          },
        },
        parcours: { select: { id: true, title: true } },
      },
    })

    return parcoursModules.map((pm) => ({
      id: pm.module.id,
      title: pm.module.title,
      content: pm.module.content,
      minDuration: pm.module.minDuration,
      published: pm.module.published,
      parcoursModules: [{ parcoursId: pm.parcoursId, order: pm.order, parcours: pm.parcours }],
      hasQuiz: !!pm.module.quiz,
      createdAt: pm.module.createdAt,
      updatedAt: pm.module.updatedAt,
    }))
  }

  // No parcoursId filter — return all modules
  const modules = await prisma.module.findMany({
    include: {
      parcoursModules: {
        include: {
          parcours: { select: { id: true, title: true } },
        },
        orderBy: { order: 'asc' },
      },
      quiz: { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return modules.map((m) => ({
    id: m.id,
    title: m.title,
    content: m.content,
    minDuration: m.minDuration,
    published: m.published,
    parcoursModules: m.parcoursModules.map((pm) => ({
      parcoursId: pm.parcoursId,
      order: pm.order,
      parcours: pm.parcours,
    })),
    hasQuiz: !!m.quiz,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }))
}

export async function getModuleById(id: string): Promise<ModuleWithDetails | null> {
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      parcoursModules: {
        include: {
          parcours: { select: { id: true, title: true } },
        },
        orderBy: { order: 'asc' },
      },
      quiz: { select: { id: true } },
    },
  })

  if (!module) return null

  return {
    id: module.id,
    title: module.title,
    content: module.content,
    minDuration: module.minDuration,
    published: module.published,
    parcoursModules: module.parcoursModules,
    hasQuiz: !!module.quiz,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  }
}

export async function createModule(input: CreateModuleInput) {
  // Validate all parcours exist
  const parcoursCount = await prisma.parcours.count({
    where: { id: { in: input.parcoursIds } },
  })
  if (parcoursCount !== input.parcoursIds.length) {
    throw new ApiError(404, 'Un ou plusieurs parcours non trouvés', 'PARCOURS_NOT_FOUND')
  }

  // Get max order for each parcours
  const orderPromises = input.parcoursIds.map(async (parcoursId) => {
    const maxOrder = await prisma.parcoursModule.aggregate({
      where: { parcoursId },
      _max: { order: true },
    })
    return { parcoursId, order: (maxOrder._max.order ?? -1) + 1 }
  })
  const orders = await Promise.all(orderPromises)

  // Create the module and link it to all parcours
  const module = await prisma.module.create({
    data: {
      title: input.title,
      content: input.content,
      minDuration: input.minDuration ?? 0,
      published: input.published ?? false,
      parcoursModules: {
        create: orders.map((o) => ({
          parcoursId: o.parcoursId,
          order: o.order,
        })),
      },
    },
    include: {
      parcoursModules: {
        include: {
          parcours: { select: { id: true, title: true } },
        },
      },
    },
  })

  return module
}

export async function updateModule(id: string, input: UpdateModuleInput) {
  const existing = await prisma.module.findUnique({
    where: { id },
    include: {
      parcoursModules: { select: { parcoursId: true } },
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  // Sync parcours associations if parcoursIds provided
  if (input.parcoursIds) {
    const currentIds = existing.parcoursModules.map((pm) => pm.parcoursId)
    const toAdd = input.parcoursIds.filter((id) => !currentIds.includes(id))
    const toRemove = currentIds.filter((id) => !input.parcoursIds!.includes(id))

    // Remove unlinked parcours
    if (toRemove.length > 0) {
      await prisma.parcoursModule.deleteMany({
        where: { moduleId: id, parcoursId: { in: toRemove } },
      })
    }

    // Add new parcours links
    for (const parcoursId of toAdd) {
      const maxOrder = await prisma.parcoursModule.aggregate({
        where: { parcoursId },
        _max: { order: true },
      })
      await prisma.parcoursModule.create({
        data: {
          moduleId: id,
          parcoursId,
          order: (maxOrder._max.order ?? -1) + 1,
        },
      })
    }
  }

  const module = await prisma.module.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.minDuration !== undefined && { minDuration: input.minDuration }),
      ...(input.published !== undefined && { published: input.published }),
    },
    include: {
      parcoursModules: {
        include: {
          parcours: { select: { id: true, title: true } },
        },
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

  // ParcoursModule records will be cascade-deleted if configured,
  // otherwise delete them explicitly first
  await prisma.parcoursModule.deleteMany({ where: { moduleId: id } })

  await prisma.module.delete({
    where: { id },
  })
}

export async function reorderModules(
  parcoursId: string,
  moduleOrders: { id: string; order: number }[]
) {
  const parcours = await prisma.parcours.findUnique({
    where: { id: parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  await prisma.$transaction(
    moduleOrders.map(({ id, order }) =>
      prisma.parcoursModule.updateMany({
        where: { moduleId: id, parcoursId },
        data: { order },
      })
    )
  )
}
