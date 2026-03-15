import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'

export interface CertificateData {
  userName: string
  parcoursTitle: string
  completedAt: Date
  modulesCompleted: number
  totalModules: number
  avgQuizScore: number | null
  totalDurationDays: number
}

async function resolveParcoursId(userId: string, parcoursId?: string): Promise<string | null> {
  if (parcoursId) return parcoursId

  // Try UserParcours first
  const assignment = await prisma.userParcours.findFirst({
    where: { userId },
    orderBy: { assignedAt: 'asc' },
    select: { parcoursId: true },
  })
  if (assignment) return assignment.parcoursId

  // Fallback: legacy
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })
  return user?.parcoursId || null
}

export async function canGenerateCertificate(userId: string, parcoursId?: string): Promise<boolean> {
  const targetParcoursId = await resolveParcoursId(userId, parcoursId)
  if (!targetParcoursId) return false

  const [completedCount, totalCount] = await Promise.all([
    prisma.progress.count({
      where: { userId, module: { parcoursId: targetParcoursId } },
    }),
    prisma.module.count({
      where: { parcoursId: targetParcoursId },
    }),
  ])

  return totalCount > 0 && completedCount === totalCount
}

export async function getCertificateData(
  userId: string,
  parcoursId?: string
): Promise<CertificateData> {
  const targetParcoursId = await resolveParcoursId(userId, parcoursId)
  if (!targetParcoursId) {
    throw new ApiError(404, 'Aucun parcours assigné', 'NOT_FOUND')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  if (!user) {
    throw new ApiError(404, 'Utilisateur non trouvé', 'NOT_FOUND')
  }

  const parcours = await prisma.parcours.findUnique({
    where: { id: targetParcoursId },
    include: { modules: { select: { id: true } } },
  })

  if (!parcours) {
    throw new ApiError(404, 'Parcours non trouvé', 'NOT_FOUND')
  }

  const completedCount = await prisma.progress.count({
    where: { userId, module: { parcoursId: targetParcoursId } },
  })

  const totalModules = parcours.modules.length

  if (completedCount < totalModules) {
    throw new ApiError(400, 'Le parcours n\'est pas encore complété', 'PARCOURS_NOT_COMPLETED')
  }

  const [lastProgress, firstProgress, quizResults] = await Promise.all([
    prisma.progress.findFirst({
      where: { userId, module: { parcoursId: targetParcoursId } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
    prisma.progress.findFirst({
      where: { userId, module: { parcoursId: targetParcoursId } },
      orderBy: { completedAt: 'asc' },
      select: { completedAt: true },
    }),
    prisma.quizResult.findMany({
      where: { progress: { userId, module: { parcoursId: targetParcoursId } } },
      select: { score: true },
    }),
  ])

  const completedAt = lastProgress?.completedAt || new Date()
  const startedAt = firstProgress?.completedAt || completedAt
  const totalDurationDays = Math.max(1, Math.ceil((completedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)))

  const avgQuizScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + q.score, 0) / quizResults.length)
    : null

  return {
    userName: user.name,
    parcoursTitle: parcours.title,
    completedAt,
    modulesCompleted: completedCount,
    totalModules,
    avgQuizScore,
    totalDurationDays,
  }
}
