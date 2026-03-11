import { NextRequest, NextResponse } from 'next/server'
import { validateInvitation } from '@/lib/services/invitation.service'
import { handleApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const result = await validateInvitation(token)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
