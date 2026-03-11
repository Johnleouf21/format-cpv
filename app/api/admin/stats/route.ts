import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAdminStats } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const stats = await getAdminStats()

    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
