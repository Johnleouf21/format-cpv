import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getParcoursWithModules } from '@/lib/services/parcours.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()

    if (!session?.user) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    const { id } = await params
    const result = await getParcoursWithModules(id, session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
