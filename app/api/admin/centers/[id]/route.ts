import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateCenterSchema = z.object({
  name: z.string().min(1).optional(),
  region: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN') throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')

    const { id } = await params
    const body = await request.json()
    const data = updateCenterSchema.parse(body)

    const center = await prisma.center.update({
      where: { id },
      data,
    })

    return NextResponse.json(center)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN') throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')

    const { id } = await params

    // Détacher les sous-centres avant suppression (UserCenter cascade via onDelete)
    await prisma.center.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })

    await prisma.center.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
