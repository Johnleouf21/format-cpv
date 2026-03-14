import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/errors/api-error'
import { checkAndAwardBadges } from './badge.service'

export interface QuizWithQuestions {
  id: string
  moduleId: string
  questions: {
    id: string
    text: string
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
    order: number
    answers: {
      id: string
      text: string
      order: number
    }[]
  }[]
}

export interface QuizSubmission {
  answers: Record<string, string[]> // questionId -> answerId[]
}

export interface QuizResultData {
  score: number
  totalQuestions: number
  correctAnswers: number
  results: {
    questionId: string
    correct: boolean
    selectedAnswers: string[]
    correctAnswers: string[]
  }[]
}

export async function getModuleQuiz(
  moduleId: string,
  userId: string
): Promise<QuizWithQuestions | null> {
  // Verify user has access to this module
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { parcoursId: true },
  })

  if (!module) {
    throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })

  if (user?.parcoursId !== module.parcoursId) {
    throw new ApiError(403, 'Accès non autorisé à ce module', 'MODULE_ACCESS_DENIED')
  }

  const quiz = await prisma.quiz.findUnique({
    where: { moduleId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
        include: {
          answers: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              text: true,
              order: true,
              // Don't expose isCorrect to client
            },
          },
        },
      },
    },
  })

  if (!quiz) {
    return null
  }

  return {
    id: quiz.id,
    moduleId: quiz.moduleId,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      order: q.order,
      answers: q.answers,
    })),
  }
}

export async function submitQuiz(
  quizId: string,
  userId: string,
  submission: QuizSubmission
): Promise<QuizResultData> {
  // Get quiz with correct answers
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      module: {
        select: { id: true, parcoursId: true },
      },
      questions: {
        include: {
          answers: true,
        },
      },
    },
  })

  if (!quiz) {
    throw new ApiError(404, 'Quiz non trouvé', 'QUIZ_NOT_FOUND')
  }

  // Verify user has access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parcoursId: true },
  })

  if (user?.parcoursId !== quiz.module.parcoursId) {
    throw new ApiError(403, 'Accès non autorisé à ce quiz', 'QUIZ_ACCESS_DENIED')
  }

  // Check if user has already completed the module with a quiz result
  const existingProgress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId: quiz.module.id },
    },
    include: {
      quizResult: true,
    },
  })

  if (existingProgress?.quizResult) {
    throw new ApiError(400, 'Quiz déjà complété pour ce module', 'QUIZ_ALREADY_COMPLETED')
  }

  // Calculate score
  const results: QuizResultData['results'] = []
  let correctCount = 0

  for (const question of quiz.questions) {
    const selectedAnswerIds = submission.answers[question.id] || []
    const correctAnswerIds = question.answers
      .filter((a) => a.isCorrect)
      .map((a) => a.id)

    // Check if all selected answers are correct and all correct answers are selected
    const isCorrect =
      selectedAnswerIds.length === correctAnswerIds.length &&
      selectedAnswerIds.every((id) => correctAnswerIds.includes(id))

    if (isCorrect) {
      correctCount++
    }

    results.push({
      questionId: question.id,
      correct: isCorrect,
      selectedAnswers: selectedAnswerIds,
      correctAnswers: correctAnswerIds,
    })
  }

  const totalQuestions = quiz.questions.length
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  // If progress exists but no quiz result, add quiz result
  if (existingProgress) {
    await prisma.quizResult.create({
      data: {
        progressId: existingProgress.id,
        score,
        totalQuestions,
        answers: submission.answers,
      },
    })
  }
  // Note: If progress doesn't exist, the quiz result will be created when the module is marked complete

  return {
    score,
    totalQuestions,
    correctAnswers: correctCount,
    results,
  }
}

export async function saveQuizResultWithProgress(
  userId: string,
  moduleId: string,
  quizResult: QuizResultData,
  submission: QuizSubmission
) {
  // Create or get progress
  let progress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
  })

  if (!progress) {
    progress = await prisma.progress.create({
      data: {
        userId,
        moduleId,
      },
    })
  }

  // Check if quiz result already exists
  const existingQuizResult = await prisma.quizResult.findUnique({
    where: { progressId: progress.id },
  })

  if (!existingQuizResult) {
    await prisma.quizResult.create({
      data: {
        progressId: progress.id,
        score: quizResult.score,
        totalQuestions: quizResult.totalQuestions,
        answers: submission.answers,
      },
    })
  }

  // Check and award badges (fire-and-forget)
  checkAndAwardBadges(userId).catch(() => {})

  return progress
}

export async function hasCompletedQuiz(
  userId: string,
  moduleId: string
): Promise<boolean> {
  const progress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
    include: {
      quizResult: true,
    },
  })

  return !!progress?.quizResult
}

export async function getUserQuizResult(
  userId: string,
  moduleId: string
): Promise<{ score: number; totalQuestions: number } | null> {
  const progress = await prisma.progress.findUnique({
    where: {
      userId_moduleId: { userId, moduleId },
    },
    include: {
      quizResult: {
        select: {
          score: true,
          totalQuestions: true,
        },
      },
    },
  })

  return progress?.quizResult || null
}
