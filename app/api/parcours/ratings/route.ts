import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getParcoursRatings } from '@/lib/services/feedback.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    await requireAuth()
    const ratings = await getParcoursRatings()
    return NextResponse.json(ratings)
  } catch (error) {
    return handleApiError(error)
  }
}
