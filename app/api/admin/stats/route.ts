import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getAdminStats } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const stats = await getAdminStats()

    return NextResponse.json(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
