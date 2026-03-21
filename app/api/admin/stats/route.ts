import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getAdminStats } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const stats = await getAdminStats()

    const response = NextResponse.json(stats)
    response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
