import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllowedDomains, addAllowedDomain } from '@/lib/services/whitelist.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { addDomainSchema } from '@/lib/validations/whitelist.schema'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès réservé aux administrateurs', 'FORBIDDEN')
    }

    const domains = await getAllowedDomains()
    return NextResponse.json(domains)
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
    const { domain } = addDomainSchema.parse(body)

    const allowedDomain = await addAllowedDomain(domain)
    return NextResponse.json(allowedDomain, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
