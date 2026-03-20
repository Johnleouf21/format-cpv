import { prisma } from '@/lib/db'

// Barème XP
const XP_MODULE_COMPLETED = 10
const XP_QUIZ_PASSED = 20       // score >= 80%
const XP_QUIZ_PERFECT = 30      // score === 100% (bonus)
const XP_BADGE = 15
const XP_PARCOURS_COMPLETE = 50

export interface XPBreakdown {
  total: number
  modules: number
  quizzes: number
  badges: number
  parcours: number
  level: number
  levelProgress: number  // 0-100% vers le prochain niveau
}

/**
 * Calcule les XP d'un utilisateur unique (pour l'API /learner/xp).
 */
export async function getUserXP(userId: string): Promise<XPBreakdown> {
  const result = await getBulkUserXP([userId])
  return result.get(userId) || emptyXP()
}

/**
 * Calcule les XP de plusieurs utilisateurs en batch (2-3 requêtes au lieu de N*4).
 */
export async function getBulkUserXP(userIds: string[]): Promise<Map<string, XPBreakdown>> {
  if (userIds.length === 0) return new Map()

  // 1. Modules complétés par user (groupBy)
  const progressCounts = await prisma.progress.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _count: true,
  })
  const moduleCountByUser = new Map(progressCounts.map((p) => [p.userId, p._count]))

  // 2. Quiz scores par user
  const quizResults = await prisma.quizResult.findMany({
    where: { progress: { userId: { in: userIds } } },
    select: { score: true, progress: { select: { userId: true } } },
  })
  const quizScoresByUser = new Map<string, number[]>()
  for (const qr of quizResults) {
    const uid = qr.progress.userId
    if (!quizScoresByUser.has(uid)) quizScoresByUser.set(uid, [])
    quizScoresByUser.get(uid)!.push(qr.score)
  }

  // 3. Badges par user (groupBy)
  const badgeCounts = await prisma.earnedBadge.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds } },
    _count: true,
  })
  const badgeCountByUser = new Map(badgeCounts.map((b) => [b.userId, b._count]))

  // 4. Parcours complétés — charger les assignments + modules en une seule requête
  const userParcoursData = await prisma.userParcours.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      parcours: {
        select: { modules: { select: { id: true } } },
      },
    },
  })

  // 5. Tous les progress (moduleIds) pour vérifier la complétion des parcours
  const allProgress = await prisma.progress.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, moduleId: true },
  })
  const completedModulesByUser = new Map<string, Set<string>>()
  for (const p of allProgress) {
    if (!completedModulesByUser.has(p.userId)) completedModulesByUser.set(p.userId, new Set())
    completedModulesByUser.get(p.userId)!.add(p.moduleId)
  }

  // Calculer les XP pour chaque user
  const result = new Map<string, XPBreakdown>()

  for (const userId of userIds) {
    const completedModules = moduleCountByUser.get(userId) || 0
    const scores = quizScoresByUser.get(userId) || []
    const badges = badgeCountByUser.get(userId) || 0
    const completedSet = completedModulesByUser.get(userId) || new Set()

    // XP modules
    const modulesXP = completedModules * XP_MODULE_COMPLETED

    // XP quizzes
    let quizzesXP = 0
    for (const score of scores) {
      if (score >= 80) quizzesXP += XP_QUIZ_PASSED
      if (score === 100) quizzesXP += XP_QUIZ_PERFECT
    }

    // XP badges
    const badgesXP = badges * XP_BADGE

    // XP parcours complétés
    let parcoursXP = 0
    const userAssignments = userParcoursData.filter((up) => up.userId === userId)
    for (const up of userAssignments) {
      const totalModules = up.parcours.modules.length
      if (totalModules > 0) {
        const done = up.parcours.modules.filter((m) => completedSet.has(m.id)).length
        if (done >= totalModules) parcoursXP += XP_PARCOURS_COMPLETE
      }
    }

    const total = modulesXP + quizzesXP + badgesXP + parcoursXP
    const { level, progress } = calculateLevel(total)

    result.set(userId, {
      total,
      modules: modulesXP,
      quizzes: quizzesXP,
      badges: badgesXP,
      parcours: parcoursXP,
      level,
      levelProgress: progress,
    })
  }

  return result
}

function emptyXP(): XPBreakdown {
  return { total: 0, modules: 0, quizzes: 0, badges: 0, parcours: 0, level: 1, levelProgress: 0 }
}

function calculateLevel(totalXP: number): { level: number; progress: number } {
  let level = 1
  let xpForCurrentLevel = 0
  let xpForNextLevel = 100

  while (totalXP >= xpForNextLevel) {
    level++
    xpForCurrentLevel = xpForNextLevel
    xpForNextLevel = Math.round(50 * level * (level + 1) / 2)
  }

  const xpInLevel = totalXP - xpForCurrentLevel
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const progress = xpNeeded > 0 ? Math.round((xpInLevel / xpNeeded) * 100) : 100

  return { level, progress }
}
