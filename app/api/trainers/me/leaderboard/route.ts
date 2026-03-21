import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { getBulkUserXP } from '@/lib/services/xp.service'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { searchParams } = new URL(request.url)
    const centerIds = searchParams.getAll('centerId')

    // Filtrer les apprenants du formateur, optionnellement par centres
    const where: Record<string, unknown> = {
      role: 'LEARNER',
      trainerId: session.user.id,
    }
    if (centerIds.length > 0) {
      where.userCenters = { some: { centerId: { in: centerIds } } }
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

    const xpMap = await getBulkUserXP(learners.map((l) => l.id))

    const leaderboard = learners.map((l) => {
      const xp = xpMap.get(l.id)
      return {
        id: l.id,
        name: l.name,
        email: l.email,
        centers: l.userCenters.map((uc) => uc.center),
        xp: xp?.total || 0,
        level: xp?.level || 1,
        levelProgress: xp?.levelProgress || 0,
        breakdown: {
          modules: xp?.modules || 0,
          quizzes: xp?.quizzes || 0,
          badges: xp?.badges || 0,
          parcours: xp?.parcours || 0,
        },
      }
    })

    leaderboard.sort((a, b) => b.xp - a.xp)

    const ranked = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    const response = NextResponse.json(ranked)
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
