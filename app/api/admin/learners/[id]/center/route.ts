import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN' && session.user.role !== 'TRAINER') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const { id } = await params
    const { centerId } = await request.json()

    const user = await prisma.user.update({
      where: { id },
      data: { centerId: centerId || null },
      select: { id: true, centerId: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    return handleApiError(error)
  }
}
