import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { submitFeedback, hasUserGivenFeedback } from '@/lib/services/feedback.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { rating, comment, anonymous } = body

    if (!rating || rating < 1 || rating > 5) {
      throw new ApiError(400, 'Note invalide (1-5)', 'INVALID_RATING')
    }

    const feedback = await submitFeedback(session.user.id, {
      rating,
      comment: comment || '',
      anonymous: !!anonymous,
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const session = await requireAuth()

    const hasGiven = await hasUserGivenFeedback(session.user.id)
    return NextResponse.json({ hasGivenFeedback: hasGiven })
  } catch (error) {
    return handleApiError(error)
  }
}
