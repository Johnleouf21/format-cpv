import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createBulkInvitations } from '@/lib/services/invitation.service'
import { sendBulkInvitationEmails } from '@/lib/services/email.service'
import { handleApiError, ApiError } from '@/lib/errors/api-error'
import { z } from 'zod'

const bulkInvitationSchema = z.object({
  emails: z.array(z.string().email('Email invalide')).min(1, 'Au moins un email requis'),
  parcoursId: z.string().uuid('ID de parcours invalide'),
  sendEmails: z.boolean().optional().default(true),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new ApiError(401, 'Non authentifié', 'UNAUTHORIZED')
    }

    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Accès refusé', 'FORBIDDEN')
    }

    const body = await request.json()
    const validation = bulkInvitationSchema.safeParse(body)

    if (!validation.success) {
      throw new ApiError(400, 'Données invalides', 'VALIDATION_ERROR')
    }

    const { emails, parcoursId, sendEmails } = validation.data

    // Create invitations
    const invitations = await createBulkInvitations(session.user.id, {
      emails,
      parcoursId,
    })

    // Send emails if requested
    let emailResults = null
    if (sendEmails && process.env.RESEND_API_KEY) {
      emailResults = await sendBulkInvitationEmails(
        invitations.map((inv) => ({
          to: inv.email!,
          inviteToken: inv.token,
          parcoursTitle: inv.parcours.title,
          trainerName: session.user.name || 'Votre formateur',
          expiresAt: inv.expiresAt,
        }))
      )
    }

    const successCount = emailResults
      ? emailResults.filter((r) => r.success).length
      : invitations.length

    const failedEmails = emailResults
      ? emailResults.filter((r) => !r.success).map((r) => r.email)
      : []

    return NextResponse.json({
      success: true,
      created: invitations.length,
      emailsSent: sendEmails ? successCount : 0,
      failedEmails,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        token: inv.token,
        expiresAt: inv.expiresAt,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
