import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { createInvitation, getTrainerInvitations } from '@/lib/services/invitation.service'
import { sendInvitationEmail } from '@/lib/services/email.service'
import { createInvitationSchema } from '@/lib/validations/invitation.schema'
import { handleApiError } from '@/lib/errors/api-error'

export async function GET() {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const invitations = await getTrainerInvitations(session.user.id)
    return NextResponse.json(invitations)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth('ADMIN', 'TRAINER')

    const body = await request.json()
    const data = createInvitationSchema.parse(body)

    const invitations = await createInvitation(session.user.id, data)

    // Send email for each invitation that has an email
    for (const invitation of invitations) {
      if (invitation.email) {
        await sendInvitationEmail({
          to: invitation.email,
          inviteToken: invitation.token,
          parcoursTitle: invitation.parcours?.title || '',
          trainerName: session.user.name || 'Votre formateur',
          expiresAt: invitation.expiresAt,
        })
      }
    }

    return NextResponse.json(invitations, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
