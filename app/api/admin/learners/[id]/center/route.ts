import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')

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
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

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

    return NextResponse.json(updated.map((uc) => uc.center))
  } catch (error) {
    return handleApiError(error)
  }
}
