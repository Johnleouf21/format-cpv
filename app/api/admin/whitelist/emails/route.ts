import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllowedEmails, addAllowedEmail } from '@/lib/services/whitelist.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { addEmailSchema } from '@/lib/validations/whitelist.schema'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const emails = await getAllowedEmails()
    return NextResponse.json(emails)
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
    const { email, role } = addEmailSchema.parse(body)

    const allowedEmail = await addAllowedEmail(email, role as UserRole)
    return NextResponse.json(allowedEmail, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
