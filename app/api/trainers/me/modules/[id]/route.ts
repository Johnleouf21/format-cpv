import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { getModuleById } from '@/lib/services/admin.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth('ADMIN', 'TRAINER')

    const { id } = await params
    const module = await getModuleById(id)

    if (!module) {
      throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
    }

    return NextResponse.json(module)
  } catch (error) {
    return handleApiError(error)
  }
}
