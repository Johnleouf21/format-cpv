import { prisma } from '@/lib/db'
import { BadgeType } from '@prisma/client'
import { createNotification } from './notification.service'

export async function checkAndAwardBadges(userId: string): Promise<BadgeType[]> {
  const [completedModules, quizResults, userParcoursAssignments, user, existingBadges] = await Promise.all([
    prisma.progress.count({ where: { userId } }),
    prisma.quizResult.findMany({
      where: { progress: { userId } },
      select: { score: true },
    }),
    prisma.userParcours.findMany({
      where: { userId },
      select: { parcoursId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { parcoursId: true },
    }),
    prisma.earnedBadge.findMany({
      where: { userId },
      select: { badgeType: true },
    }),
  ])

  // Merge UserParcours + legacy parcoursId (deduplicate)
  const parcoursIds = new Set(userParcoursAssignments.map((a) => a.parcoursId))
  if (user?.parcoursId) parcoursIds.add(user.parcoursId)
  const assignments = Array.from(parcoursIds).map((parcoursId) => ({ parcoursId }))

  const earnedSet = new Set(existingBadges.map((b) => b.badgeType))
  const quizzesTaken = quizResults.length
  const hasQuizAbove80 = quizResults.some((r) => r.score >= 80)
  const hasPerfectQuiz = quizResults.some((r) => r.score === 100)

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
    [BadgeType.FIRST_QUIZ, quizzesTaken >= 1],
    [BadgeType.QUIZ_ACE, hasQuizAbove80],
    [BadgeType.PERFECT_QUIZ, hasPerfectQuiz],
    [BadgeType.FIVE_QUIZZES, quizzesTaken >= 5],
    [BadgeType.PARCOURS_COMPLETE, completedParcours >= 1],
    [BadgeType.MULTI_PARCOURS, totalParcours >= 3],
    [BadgeType.CHAMPION, totalParcours > 0 && completedParcours === totalParcours],
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

  // Notifications in-app pour les nouveaux badges
  for (const badge of newBadges) {
    createNotification({
      userId,
      title: 'Nouveau badge obtenu !',
      message: `Félicitations, vous avez obtenu le badge "${badge.replace(/_/g, ' ').toLowerCase()}" !`,
      link: '/learner',
    })
  }

  return newBadges
}

export async function getUserBadges(userId: string) {
  return prisma.earnedBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
  })
}
