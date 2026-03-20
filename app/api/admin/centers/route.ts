import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { logActivity } from '@/lib/services/activity-log.service'

const createCenterSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  region: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const centers = await prisma.center.findMany({
      include: {
        _count: { select: { userCenters: true, children: true } },
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true, _count: { select: { userCenters: true } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(centers)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }
    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const body = await request.json()
    const data = createCenterSchema.parse(body)

    const center = await prisma.center.create({
      data: {
        name: data.name,
        region: data.region,
        parentId: data.parentId || null,
      },
    })

    logActivity({
      action: 'CENTER_CREATED',
      details: `Centre "${data.name}" créé`,
      userId: session.user.id,
      targetId: center.id,
      targetType: 'center',
    })

    return NextResponse.json(center, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
