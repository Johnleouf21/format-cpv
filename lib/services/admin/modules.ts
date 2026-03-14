import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

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
  const parcours = await prisma.parcours.findUnique({
    where: { id: input.parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

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
  const existing = await prisma.module.findUnique({
    where: { id },
  })

  if (!existing) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

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
  const parcours = await prisma.parcours.findUnique({
    where: { id: parcoursId },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
  }

  await prisma.$transaction(
    moduleOrders.map(({ id, order }) =>
      prisma.module.update({
        where: { id, parcoursId },
        data: { order },
      })
    )
  )
}
