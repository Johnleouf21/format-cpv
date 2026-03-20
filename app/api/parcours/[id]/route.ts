import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getParcoursWithModules } from '@/lib/services/parcours.service'
import { handleApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()

    const { id } = await params
    const result = await getParcoursWithModules(id, session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
