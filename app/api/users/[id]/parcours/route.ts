import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { assignParcours, unassignParcours } from '@/lib/services/user-management.service'
import { assignParcoursSchema, unassignParcoursSchema } from '@/lib/validations/user-management.schema'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { id: userId } = await params
    const body = await request.json()
    const data = assignParcoursSchema.parse(body)

    // TRAINER can only assign to their own learners
    if (session.user.role === 'TRAINER') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user || user.trainerId !== session.user.id) {
        throw new ApiError(403, 'Vous ne pouvez assigner des parcours qu\'à vos propres apprenants', 'FORBIDDEN')
      }
    }

    const assignment = await assignParcours({
      userId,
      parcoursId: data.parcoursId,
      assignedByName: session.user.name || undefined,
      sendNotification: data.sendNotification,
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { id: userId } = await params
    const body = await request.json()
    const data = unassignParcoursSchema.parse(body)

    // TRAINER can only unassign from their own learners
    if (session.user.role === 'TRAINER') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user || user.trainerId !== session.user.id) {
        throw new ApiError(403, 'Vous ne pouvez retirer des parcours qu\'à vos propres apprenants', 'FORBIDDEN')
      }
    }

    await unassignParcours({ userId, parcoursId: data.parcoursId })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
