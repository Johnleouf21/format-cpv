import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
  }

  // Only admins and trainers can assign parcours
  if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })
  }

  try {
    const { id } = await params
    const { parcoursId } = await request.json()

    // Get the learner
    const learner = await prisma.user.findUnique({
      where: { id, role: 'LEARNER' },
    })

    if (!learner) {
      return NextResponse.json(
        { message: 'Apprenant non trouvé' },
        { status: 404 }
      )
    }

    // If trainer, can only assign parcours to their own learners
    if (session.user.role === 'TRAINER' && learner.trainerId !== session.user.id) {
      return NextResponse.json(
        { message: 'Vous ne pouvez attribuer un parcours qu\'à vos propres apprenants' },
        { status: 403 }
      )
    }

    // Verify parcours exists if parcoursId is provided
    if (parcoursId) {
      const parcours = await prisma.parcours.findUnique({
        where: { id: parcoursId },
      })

      if (!parcours) {
        return NextResponse.json(
          { message: 'Parcours non trouvé' },
          { status: 404 }
        )
      }
    }

    // Update the learner's parcours
    const updatedLearner = await prisma.user.update({
      where: { id },
      data: { parcoursId: parcoursId || null },
      include: {
        parcours: {
          select: { id: true, title: true },
        },
        trainer: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // If parcours changed, reset progress (optional - could also keep progress)
    if (learner.parcoursId !== parcoursId) {
      await prisma.progress.deleteMany({
        where: { userId: id },
      })
    }

    return NextResponse.json(updatedLearner)
  } catch (error) {
    console.error('Error assigning parcours:', error)
    return NextResponse.json(
      { message: 'Erreur lors de l\'attribution du parcours' },
      { status: 500 }
    )
  }
}
