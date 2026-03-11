import { NextRequest, NextResponse } from 'next/server'
import { redeemInvitation } from '@/lib/services/invitation.service'
import { redeemInvitationSchema } from '@/lib/validations/invitation.schema'
import { handleApiError } from '@/lib/errors/api-error'

interface RouteParams {
  params: Promise<{ token: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const body = await request.json()
    const data = redeemInvitationSchema.parse(body)

    const user = await redeemInvitation(token, data)

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
