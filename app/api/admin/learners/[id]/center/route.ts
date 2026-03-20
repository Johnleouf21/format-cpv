import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { logActivity } from '@/lib/services/activity-log.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth('ADMIN', 'TRAINER')

    const { id } = await params
    const userCenters = await prisma.userCenter.findMany({
      where: { userId: id },
      include: { center: { select: { id: true, name: true, parentId: true } } },
    })

    return NextResponse.json(userCenters.map((uc) => uc.center))
  } catch (error) {
    return handleApiError(error)
  }
}

// Remplace tous les centres d'un apprenant
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { id } = await params
    const { centerIds } = await request.json() as { centerIds: string[] }

    // Supprimer les anciens rattachements
    await prisma.userCenter.deleteMany({ where: { userId: id } })

    // Créer les nouveaux
    if (centerIds && centerIds.length > 0) {
      await prisma.userCenter.createMany({
        data: centerIds.map((centerId: string) => ({ userId: id, centerId })),
        skipDuplicates: true,
      })
    }

    const updated = await prisma.userCenter.findMany({
      where: { userId: id },
      include: { center: { select: { id: true, name: true } } },
    })

    logActivity({
      action: 'CENTER_ASSIGNED',
      details: `${centerIds.length} centre(s) assigné(s) à l'apprenant`,
      userId: session.user.id,
      targetId: id,
      targetType: 'user',
    })

    return NextResponse.json(updated.map((uc) => uc.center))
  } catch (error) {
    return handleApiError(error)
  }
}
