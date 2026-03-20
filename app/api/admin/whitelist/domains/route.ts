import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getAllowedDomains, addAllowedDomain } from '@/lib/services/whitelist.service'
import { handleApiError } from '@/lib/errors/api-error'
import { addDomainSchema } from '@/lib/validations/whitelist.schema'

export async function GET() {
  try {
    await requireAuth('ADMIN')

    const domains = await getAllowedDomains()
    return NextResponse.json(domains)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const { domain } = addDomainSchema.parse(body)

    const allowedDomain = await addAllowedDomain(domain)
    return NextResponse.json(allowedDomain, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
