import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { getUserXP } from '@/lib/services/xp.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const { searchParams } = new URL(request.url)
    const centerId = searchParams.get('centerId') || undefined

    // Filtrer les apprenants du formateur, optionnellement par centre
    const where: Record<string, unknown> = {
      role: 'LEARNER',
      trainerId: session.user.id,
    }
    if (centerId) {
      where.userCenters = { some: { centerId } }
    }

    const learners = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        userCenters: { include: { center: { select: { id: true, name: true } } } },
      },
    })

    const leaderboard = await Promise.all(
      learners.map(async (l) => {
        const xp = await getUserXP(l.id)
        return {
          id: l.id,
          name: l.name,
          email: l.email,
          centers: l.userCenters.map((uc) => uc.center),
          xp: xp.total,
          level: xp.level,
          levelProgress: xp.levelProgress,
          breakdown: {
            modules: xp.modules,
            quizzes: xp.quizzes,
            badges: xp.badges,
            parcours: xp.parcours,
          },
        }
      })
    )

    leaderboard.sort((a, b) => b.xp - a.xp)

    const ranked = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    return NextResponse.json(ranked)
  } catch (error) {
    return handleApiError(error)
  }
}
