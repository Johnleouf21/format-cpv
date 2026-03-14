import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { assignParcours } from '@/lib/services/user-management.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Non autorisé', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const { id } = await params
    const { parcoursId } = await request.json()

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND')
    }

    // If trainer, can only assign to their own learners
    if (session.user.role === 'TRAINER' && user.trainerId !== session.user.id) {
      throw new ApiError(403, 'Vous ne pouvez attribuer un parcours qu\'à vos propres apprenants', 'FORBIDDEN')
    }

    if (!parcoursId) {
      throw new ApiError(400, 'ID de parcours requis', 'MISSING_PARCOURS_ID')
    }

    // Add parcours (keeps existing ones) + send notification email
    await assignParcours({
      userId: id,
      parcoursId,
      assignedByName: session.user.name || undefined,
      sendNotification: true,
    })

    // Return updated user with all parcours
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        userParcours: {
          include: {
            parcours: { select: { id: true, title: true } },
          },
        },
        trainer: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    const primaryParcours = updatedUser?.userParcours[0]?.parcours || null

    return NextResponse.json({
      ...updatedUser,
      parcours: primaryParcours,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
