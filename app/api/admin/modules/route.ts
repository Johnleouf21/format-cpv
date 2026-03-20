import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getModules, createModule } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import { logActivity } from '@/lib/services/activity-log.service'

const createModuleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  parcoursId: z.string().uuid('ID de parcours invalide'),
  order: z.number().int().min(0).optional(),
  minDuration: z.number().int().min(0).max(480).optional().default(0),
  published: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

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
    const session = await requireAuth('ADMIN')

    const body = await request.json()
    const data = createModuleSchema.parse(body)

    const module = await createModule(data)

    logActivity({
      action: 'MODULE_CREATED',
      details: `Module "${data.title}" créé`,
      userId: session.user.id,
      targetId: module.id,
      targetType: 'module',
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
