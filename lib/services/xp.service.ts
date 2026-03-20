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
 * Calcule les XP d'un utilisateur à la volée (pas stocké en base).
 */
export async function getUserXP(userId: string): Promise<XPBreakdown> {
  const [completedModules, quizResults, badges, userParcours] = await Promise.all([
    prisma.progress.count({ where: { userId } }),
    prisma.quizResult.findMany({
      where: { progress: { userId } },
      select: { score: true },
    }),
    prisma.earnedBadge.count({ where: { userId } }),
    prisma.userParcours.findMany({
      where: { userId },
      include: {
        parcours: {
          select: { modules: { select: { id: true } } },
        },
      },
    }),
  ])

  // XP modules
  const modulesXP = completedModules * XP_MODULE_COMPLETED

  // XP quizzes
  let quizzesXP = 0
  for (const qr of quizResults) {
    if (qr.score >= 80) quizzesXP += XP_QUIZ_PASSED
    if (qr.score === 100) quizzesXP += XP_QUIZ_PERFECT
  }

  // XP badges
  const badgesXP = badges * XP_BADGE

  // XP parcours complétés
  const completedModuleIds = await prisma.progress.findMany({
    where: { userId },
    select: { moduleId: true },
  })
  const completedSet = new Set(completedModuleIds.map((p) => p.moduleId))

  let parcoursXP = 0
  for (const up of userParcours) {
    const totalModules = up.parcours.modules.length
    if (totalModules > 0) {
      const done = up.parcours.modules.filter((m) => completedSet.has(m.id)).length
      if (done >= totalModules) parcoursXP += XP_PARCOURS_COMPLETE
    }
  }

  const total = modulesXP + quizzesXP + badgesXP + parcoursXP

  // Système de niveaux : chaque niveau demande un peu plus d'XP
  // Niveau 1 = 0 XP, Niveau 2 = 100 XP, Niveau 3 = 250 XP, etc.
  const { level, progress } = calculateLevel(total)

  return {
    total,
    modules: modulesXP,
    quizzes: quizzesXP,
    badges: badgesXP,
    parcours: parcoursXP,
    level,
    levelProgress: progress,
  }
}

function calculateLevel(totalXP: number): { level: number; progress: number } {
  // Paliers : 0, 100, 250, 450, 700, 1000, 1400, ...
  // Formule : xpNeeded(n) = 50 * n * (n + 1)
  let level = 1
  let xpForCurrentLevel = 0
  let xpForNextLevel = 100

  while (totalXP >= xpForNextLevel) {
    level++
    xpForCurrentLevel = xpForNextLevel
    xpForNextLevel = xpForCurrentLevel + 50 * (level) * (level + 1) / level
    // Simplified: each level needs ~50 more XP than the previous increment
    xpForNextLevel = Math.round(50 * level * (level + 1) / 2)
  }

  const xpInLevel = totalXP - xpForCurrentLevel
  const xpNeeded = xpForNextLevel - xpForCurrentLevel
  const progress = xpNeeded > 0 ? Math.round((xpInLevel / xpNeeded) * 100) : 100

  return { level, progress }
}
