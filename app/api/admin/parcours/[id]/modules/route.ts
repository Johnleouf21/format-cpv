import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { logActivity } from '@/lib/services/activity-log.service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth('ADMIN')
    const { id: parcoursId } = await params
    const { moduleId } = await request.json()

    if (!moduleId) {
      throw new ApiError(400, 'moduleId requis', 'MISSING_MODULE_ID')
    }

    // Vérifier que le parcours existe
    const parcours = await prisma.parcours.findUnique({
      where: { id: parcoursId },
    })
    if (!parcours) {
      throw new ApiError(404, 'Parcours non trouvé', 'PARCOURS_NOT_FOUND')
    }

    // Vérifier que le module existe
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    })
    if (!module) {
      throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
    }

    // Vérifier qu'il n'est pas déjà dans ce parcours
    const existing = await prisma.parcoursModule.findUnique({
      where: { parcoursId_moduleId: { parcoursId, moduleId } },
    })
    if (existing) {
      throw new ApiError(409, 'Ce module est déjà dans ce parcours', 'ALREADY_EXISTS')
    }

    // Trouver le prochain ordre
    const maxOrder = await prisma.parcoursModule.aggregate({
      where: { parcoursId },
      _max: { order: true },
    })
    const nextOrder = (maxOrder._max.order ?? -1) + 1

    // Créer le lien
    await prisma.parcoursModule.create({
      data: {
        parcoursId,
        moduleId,
        order: nextOrder,
      },
    })

    logActivity({
      action: 'MODULE_CREATED',
      userId: session.user.id,
      targetId: moduleId,
      targetType: 'module',
      details: `Module "${module.title}" ajouté au parcours "${parcours.title}"`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
