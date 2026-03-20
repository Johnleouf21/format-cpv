import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { reorderModules } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const reorderSchema = z.object({
  parcoursId: z.string().uuid('ID de parcours invalide'),
  moduleOrders: z.array(
    z.object({
      id: z.string().uuid('ID de module invalide'),
      order: z.number().int().min(0),
    })
  ),
})

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const { parcoursId, moduleOrders } = reorderSchema.parse(body)

    await reorderModules(parcoursId, moduleOrders)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
