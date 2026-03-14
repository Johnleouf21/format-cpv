import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getModuleById, updateModule, deleteModule } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { prisma } from '@/lib/db'
import { sendContentUpdateEmailBulk } from '@/lib/services/email.service'
import { z } from 'zod'

const updateModuleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').optional(),
  content: z.string().min(1, 'Le contenu est requis').optional(),
  parcoursId: z.string().uuid('ID de parcours invalide').optional(),
  order: z.number().int().min(0).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const module = await getModuleById(id)

    if (!module) {
      throw new ApiError(404, 'Module non trouvé', 'MODULE_NOT_FOUND')
    }

    return NextResponse.json(module)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    const body = await request.json()
    const data = updateModuleSchema.parse(body)

    const module = await updateModule(id, data)

    // Notify assigned learners (fire-and-forget)
    if (module.parcours) {
      const parcoursId = module.parcours.id
      prisma.userParcours.findMany({
        where: { parcoursId },
        include: { user: { select: { email: true } } },
      }).then((assignments) => {
        const emails = assignments.map((a) => a.user.email)
        if (emails.length > 0) {
          sendContentUpdateEmailBulk(emails, {
            contentType: 'module',
            contentTitle: module.title,
            parcoursTitle: module.parcours!.title,
          })
        }
      }).catch(() => { /* email errors should not block */ })
    }

    return NextResponse.json(module)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { id } = await params
    await deleteModule(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
