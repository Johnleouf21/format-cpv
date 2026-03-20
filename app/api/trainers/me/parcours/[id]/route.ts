import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError } from '@/lib/errors/api-error'
import { getParcoursById } from '@/lib/services/admin.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { id } = await params
    const parcours = await getParcoursById(id)

    return NextResponse.json(parcours)
  } catch (error) {
    return handleApiError(error)
  }
}
