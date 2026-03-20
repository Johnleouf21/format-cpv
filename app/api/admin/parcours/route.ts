import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getParcours, createParcours } from '@/lib/services/admin.service'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'
import { logActivity } from '@/lib/services/activity-log.service'

const createParcoursSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
})

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const parcours = await getParcours()

    return NextResponse.json(parcours)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN')

    const body = await request.json()
    const data = createParcoursSchema.parse(body)

    const parcours = await createParcours(data)

    logActivity({
      action: 'PARCOURS_CREATED',
      details: `Parcours "${data.title}" créé`,
      userId: session.user.id,
      targetId: parcours.id,
      targetType: 'parcours',
    })

    return NextResponse.json(parcours, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
