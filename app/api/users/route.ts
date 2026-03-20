import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { addUser, getUsers } from '@/lib/services/user-management.service'
import { addUserSchema } from '@/lib/validations/user-management.schema'
import { handleApiError, ApiError } from '@/lib/errors/api-error'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const { searchParams } = request.nextUrl
    const parcoursId = searchParams.get('parcoursId') || undefined
    const role = searchParams.get('role') as 'LEARNER' | 'TRAINER' | 'ADMIN' | undefined
    const search = searchParams.get('search') || undefined

    // TRAINER can only see their own learners
    const trainerId = session.user.role === 'TRAINER' ? session.user.id : searchParams.get('trainerId') || undefined

    const users = await getUsers({ trainerId, parcoursId, role, search })
    return NextResponse.json(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const body = await request.json()
    const data = addUserSchema.parse(body)

    // TRAINER: can only assign existing users, not create new ones
    if (session.user.role === 'TRAINER') {
      if (data.role && data.role !== 'LEARNER') {
        throw new ApiError(403, 'Un formateur ne peut gérer que des apprenants', 'FORBIDDEN')
      }

      // Vérifier que l'utilisateur existe déjà
      const { prisma } = await import('@/lib/db')
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true, trainerId: true, role: true },
      })
      if (!existingUser) {
        throw new ApiError(403, 'Utilisateur inexistant. Contactez votre administrateur pour l\'ajouter.', 'TRAINER_CANNOT_CREATE')
      }

      // Vérifier que l'apprenant n'est pas déjà assigné à un autre formateur
      if (existingUser.trainerId && existingUser.trainerId !== session.user.id) {
        throw new ApiError(403, 'Cet apprenant est déjà assigné à un autre formateur.', 'ALREADY_ASSIGNED')
      }

      data.role = 'LEARNER'
      data.trainerId = session.user.id
    }

    const result = await addUser({
      ...data,
      addedBy: session.user.id,
      addedByName: session.user.name || undefined,
    })

    return NextResponse.json(result, { status: result.isNew ? 201 : 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
