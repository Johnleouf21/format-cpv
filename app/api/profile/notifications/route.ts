import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const updatePreferencesSchema = z.object({
  emailWelcome: z.boolean().optional(),
  emailAssignment: z.boolean().optional(),
  emailContentUpdate: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await requireAuth()

    // Get or create default preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
        emailWelcome: true,
        emailAssignment: true,
        emailContentUpdate: true,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const data = updatePreferencesSchema.parse(body)

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        emailWelcome: data.emailWelcome ?? true,
        emailAssignment: data.emailAssignment ?? true,
        emailContentUpdate: data.emailContentUpdate ?? true,
      },
    })

    return NextResponse.json(preferences)
  } catch (error) {
    return handleApiError(error)
  }
}
