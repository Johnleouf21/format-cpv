import { prisma } from '@/lib/db'
import { BadgeType } from '@prisma/client'

export async function checkAndAwardBadges(userId: string): Promise<BadgeType[]> {
  const [completedModules, quizResults, assignments, existingBadges] = await Promise.all([
    prisma.progress.count({ where: { userId } }),
    prisma.quizResult.findMany({
      where: { progress: { userId } },
      select: { score: true },
    }),
    prisma.userParcours.findMany({
      where: { userId },
      select: { parcoursId: true },
    }),
    prisma.earnedBadge.findMany({
      where: { userId },
      select: { badgeType: true },
    }),
  ])

  const earnedSet = new Set(existingBadges.map((b) => b.badgeType))
  const quizzesTaken = quizResults.length
  const avgScore = quizzesTaken > 0
    ? Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizzesTaken)
    : 0

  // Calculate completed parcours
  let completedParcours = 0
  for (const assignment of assignments) {
    const totalModules = await prisma.module.count({
      where: { parcoursId: assignment.parcoursId },
    })
    if (totalModules === 0) continue
    const completedInParcours = await prisma.progress.count({
      where: {
        userId,
        module: { parcoursId: assignment.parcoursId },
      },
    })
    if (completedInParcours >= totalModules) {
      completedParcours++
    }
  }

  const totalParcours = assignments.length

  // Define badge conditions
  const conditions: [BadgeType, boolean][] = [
    [BadgeType.FIRST_MODULE, completedModules >= 1],
    [BadgeType.FIVE_MODULES, completedModules >= 5],
    [BadgeType.TEN_MODULES, completedModules >= 10],
    [BadgeType.QUIZ_ACE, quizzesTaken >= 1 && avgScore >= 80],
    [BadgeType.PERFECT_QUIZ, quizzesTaken >= 1 && avgScore === 100],
    [BadgeType.FIVE_QUIZZES, quizzesTaken >= 5],
    [BadgeType.PARCOURS_COMPLETE, completedParcours >= 1],
    [BadgeType.MULTI_PARCOURS, totalParcours >= 3],
    [BadgeType.CHAMPION, totalParcours > 0 && completedParcours === totalParcours],
    [BadgeType.SPEEDSTER, completedModules >= 3], // Complete 3+ modules (fast learner)
  ]

  const newBadges: BadgeType[] = []

  for (const [badgeType, condition] of conditions) {
    if (condition && !earnedSet.has(badgeType)) {
      try {
        await prisma.earnedBadge.create({
          data: { userId, badgeType },
        })
        newBadges.push(badgeType)
      } catch {
        // Unique constraint violation = already earned, skip
      }
    }
  }

  return newBadges
}

export async function getUserBadges(userId: string) {
  return prisma.earnedBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  })
}
