import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { getUserXP } from '@/lib/services/xp.service'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    const learners = await prisma.user.findMany({
      where: { role: 'LEARNER' },
      select: { id: true, name: true },
    })

    const leaderboard = await Promise.all(
      learners.map(async (l) => {
        const xp = await getUserXP(l.id)
        return {
          id: l.id,
          name: l.name,
          xp: xp.total,
          level: xp.level,
          levelProgress: xp.levelProgress,
          isCurrentUser: l.id === session.user.id,
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
