import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getParcoursById, updateParcours, deleteParcours } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { sendContentUpdateEmailBulk } from '@/lib/services/email.service'
import { z } from 'zod'

const updateParcoursSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').optional(),
  description: z.string().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const parcours = await getParcoursById(id)

    return NextResponse.json(parcours)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const body = await request.json()
    const data = updateParcoursSchema.parse(body)

    const parcours = await updateParcours(id, data)

    // Notify assigned learners (fire-and-forget)
    prisma.userParcours.findMany({
      where: { parcoursId: id },
      include: { user: { select: { email: true } } },
    }).then((assignments) => {
      const emails = assignments.map((a) => a.user.email)
      if (emails.length > 0) {
        sendContentUpdateEmailBulk(emails, {
          contentType: 'parcours',
          contentTitle: parcours.title,
        })
      }
    }).catch(() => { /* email errors should not block */ })

    return NextResponse.json(parcours)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    await deleteParcours(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
