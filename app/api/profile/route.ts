import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { name } = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    return handleApiError(error)
  }
}
