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

    // Récupérer les centres et le formateur de l'utilisateur connecté
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        trainerId: true,
        userCenters: { include: { center: { select: { id: true, name: true } } } },
      },
    })

    const userCenterIds = currentUser?.userCenters.map((uc) => uc.center.id) || []

    // Priorité : centres > formateur > tous
    let where: Record<string, unknown> = { role: 'LEARNER' }
    let groupLabel = 'tous les apprenants'

    if (userCenterIds.length > 0) {
      // Apprenants qui partagent au moins un centre
      where = { role: 'LEARNER', userCenters: { some: { centerId: { in: userCenterIds } } } }
      const centerNames = currentUser!.userCenters.map((uc) => uc.center.name)
      groupLabel = centerNames.join(', ')
    } else if (currentUser?.trainerId) {
      where = { role: 'LEARNER', trainerId: currentUser.trainerId }
      groupLabel = 'votre groupe'
    }

    const learners = await prisma.user.findMany({
      where,
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

    return NextResponse.json({ entries: ranked, groupLabel })
  } catch (error) {
    return handleApiError(error)
  }
}
