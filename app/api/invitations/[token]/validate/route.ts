import { NextRequest, NextResponse } from 'next/server'
import { validateInvitation } from '@/lib/services/invitation.service'
import { handleApiError } from '@/lib/errors/api-error'
import { checkRateLimit } from '@/lib/utils/rate-limit'

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimited = checkRateLimit(request, 'validate-invitation', { maxRequests: 10, windowSeconds: 60 })
  if (rateLimited) return rateLimited

  try {
    const { token } = await params

    // Valider le format UUID du token
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(token)) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    const result = await validateInvitation(token)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
