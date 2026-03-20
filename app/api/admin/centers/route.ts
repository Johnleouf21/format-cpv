import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createCenterSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  region: z.string().optional(),
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
        _count: { select: { users: true } },
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
      data: { name: data.name, region: data.region },
    })

    return NextResponse.json(center, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
