import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getParcoursRatings } from '@/lib/services/feedback.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    await requireAuth()
    const ratings = await getParcoursRatings()
    const response = NextResponse.json(ratings)
    response.headers.set('Cache-Control', 's-maxage=120, stale-while-revalidate=300')
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
