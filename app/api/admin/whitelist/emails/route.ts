import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getAllowedEmails, addAllowedEmail } from '@/lib/services/whitelist.service'
import { handleApiError } from '@/lib/errors/api-error'
import { addEmailSchema } from '@/lib/validations/whitelist.schema'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const emails = await getAllowedEmails()
    return NextResponse.json(emails)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const { email, role } = addEmailSchema.parse(body)

    const allowedEmail = await addAllowedEmail(email, role as UserRole)
    return NextResponse.json(allowedEmail, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
