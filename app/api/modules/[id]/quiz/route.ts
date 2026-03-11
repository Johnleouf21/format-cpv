import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getModuleQuiz, getUserQuizResult } from '@/lib/services/quiz.service'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { id: moduleId } = await params

    const [quiz, previousResult] = await Promise.all([
      getModuleQuiz(moduleId, session.user.id),
      getUserQuizResult(session.user.id, moduleId),
    ])

    if (!quiz) {
      return NextResponse.json(
        { hasQuiz: false, quiz: null, previousResult: null }
      )
    }

    return NextResponse.json({
      hasQuiz: true,
      quiz,
      previousResult,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
