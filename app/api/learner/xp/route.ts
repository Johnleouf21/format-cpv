import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getUserXP } from '@/lib/services/xp.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await requireAuth()

    const xp = await getUserXP(session.user.id)
    return NextResponse.json(xp)
  } catch (error) {
    return handleApiError(error)
  }
}
