import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getModuleById } from '@/lib/services/module.service'
import { handleApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth()

    const { id } = await params
    const result = await getModuleById(id, session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
