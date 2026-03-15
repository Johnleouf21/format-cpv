import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllFeedback, getFeedbackStats } from '@/lib/services/feedback.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès non autorisé', 'FORBIDDEN')
    }

    const [feedbacks, stats] = await Promise.all([
      getAllFeedback(),
      getFeedbackStats(),
    ])

    return NextResponse.json({ feedbacks, stats })
  } catch (error) {
    return handleApiError(error)
  }
}
