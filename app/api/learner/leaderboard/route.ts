import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    // Récupérer tous les apprenants avec leurs stats
    const learners = await prisma.user.findMany({
      where: { role: 'LEARNER' },
      select: {
        id: true,
        name: true,
        progress: {
          select: { id: true },
        },
        earnedBadges: {
          select: { id: true },
        },
        userParcours: {
          include: {
            parcours: {
              select: {
                modules: { select: { id: true } },
              },
            },
          },
        },
      },
    })

    // Récupérer les quiz results via progress
    const quizResults = await prisma.quizResult.findMany({
      select: {
        score: true,
        progress: {
          select: { userId: true },
        },
      },
    })

    // Grouper les scores quiz par user
    const quizScoresByUser = new Map<string, number[]>()
    for (const qr of quizResults) {
      const userId = qr.progress.userId
      if (!quizScoresByUser.has(userId)) {
        quizScoresByUser.set(userId, [])
      }
      quizScoresByUser.get(userId)!.push(qr.score)
    }

    const leaderboard = learners
      .map((l) => {
        const totalModules = l.userParcours.reduce(
          (acc, up) => acc + up.parcours.modules.length,
          0
        )
        const completedModules = l.progress.length
        const scores = quizScoresByUser.get(l.id) || []
        const avgQuizScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0

        // Score composite : progression (40%) + quiz (40%) + badges (20%)
        const progressScore = totalModules > 0 ? (completedModules / totalModules) * 100 : 0
        const badgeScore = Math.min(l.earnedBadges.length * 10, 100)
        const compositeScore = Math.round(
          progressScore * 0.4 + avgQuizScore * 0.4 + badgeScore * 0.2
        )

        return {
          id: l.id,
          name: l.name,
          completedModules,
          totalModules,
          badges: l.earnedBadges.length,
          avgQuizScore,
          compositeScore,
          isCurrentUser: l.id === session.user.id,
        }
      })
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return NextResponse.json(leaderboard)
  } catch (error) {
    return handleApiError(error)
  }
}
