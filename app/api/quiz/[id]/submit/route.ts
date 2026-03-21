import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { submitQuiz, saveQuizResultWithProgress } from '@/lib/services/quiz.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import { logActivity } from '@/lib/services/activity-log.service'

const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.array(z.string())),
  completeModule: z.boolean().optional().default(false),
  moduleId: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()

    const { id: quizId } = await params
    const body = await request.json()

    const validation = submitQuizSchema.safeParse(body)
    if (!validation.success) {
      throw new ApiError(400, 'Données invalides', 'VALIDATION_ERROR')
    }

    const { answers, moduleId } = validation.data

    const result = await submitQuiz(quizId, session.user.id, { answers })

    // Save quiz result (creates Progress + QuizResult record, but doesn't trigger completion)
    if (moduleId) {
      await saveQuizResultWithProgress(
        session.user.id,
        moduleId,
        result,
        { answers }
      )
    }

    logActivity({
      action: 'QUIZ_SUBMITTED',
      details: `Quiz soumis — score ${result.score}%`,
      userId: session.user.id,
      targetId: quizId,
      targetType: 'quiz',
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
