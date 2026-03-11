import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getModules, createModule } from '@/lib/services/admin.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  parcoursId: z.string().uuid('ID de parcours invalide'),
  order: z.number().int().min(0).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const { searchParams } = new URL(request.url)
    const parcoursId = searchParams.get('parcoursId') || undefined

    const modules = await getModules(parcoursId)

    return NextResponse.json(modules)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const body = await request.json()
    const data = createModuleSchema.parse(body)

    const module = await createModule(data)

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
