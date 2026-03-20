import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getAllFeedback, getFeedbackStats } from '@/lib/services/feedback.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const [feedbacks, stats] = await Promise.all([
      getAllFeedback(),
      getFeedbackStats(),
    ])

    return NextResponse.json({ feedbacks, stats })
  } catch (error) {
    return handleApiError(error)
  }
}
