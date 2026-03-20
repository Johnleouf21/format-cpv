import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { handleApiError } from '@/lib/errors/api-error'
import { getParcours } from '@/lib/services/admin.service'

export async function GET() {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const parcours = await getParcours()

    return NextResponse.json(parcours)
  } catch (error) {
    return handleApiError(error)
  }
}
