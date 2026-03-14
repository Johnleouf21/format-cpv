import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

// GET quiz for a module (admin view with correct answers)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN') throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')

    const { id: moduleId } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { moduleId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json(quiz)
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT - Create or replace full quiz for a module
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN') throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')

    const { id: moduleId } = await params
    const body = await request.json()

    // Validate module exists
    const module = await prisma.module.findUnique({ where: { id: moduleId } })
    if (!module) throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')

    // Validate questions
    const questions: {
      text: string
      type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
      order: number
      answers: { text: string; isCorrect: boolean; order: number }[]
    }[] = body.questions

    if (!questions || questions.length === 0) {
      throw new ApiError(400, 'Au moins une question est requise', 'INVALID_QUIZ')
    }

    for (const q of questions) {
      if (!q.text?.trim()) throw new ApiError(400, 'Chaque question doit avoir un texte', 'INVALID_QUIZ')
      if (!q.answers || q.answers.length < 2) throw new ApiError(400, 'Chaque question doit avoir au moins 2 réponses', 'INVALID_QUIZ')
      if (!q.answers.some((a) => a.isCorrect)) throw new ApiError(400, 'Chaque question doit avoir au moins une bonne réponse', 'INVALID_QUIZ')
    }

    // Delete existing quiz if any
    await prisma.quiz.deleteMany({ where: { moduleId } })

    // Create new quiz with questions and answers
    const quiz = await prisma.quiz.create({
      data: {
        moduleId,
        questions: {
          create: questions.map((q, qi) => ({
            text: q.text,
            type: q.type,
            order: qi,
            answers: {
              create: q.answers.map((a, ai) => ({
                text: a.text,
                isCorrect: a.isCorrect,
                order: ai,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json(quiz)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE - Remove quiz from a module
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    if (session.user.role !== 'ADMIN') throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')

    const { id: moduleId } = await params

    await prisma.quiz.deleteMany({ where: { moduleId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
