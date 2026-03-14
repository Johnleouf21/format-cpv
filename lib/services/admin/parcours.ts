import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

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
