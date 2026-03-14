import { Resend } from 'resend'
import { prisma } from '@/lib/db'

const FROM_EMAIL = process.env.EMAIL_FROM || 'FormaCPV <onboarding@resend.dev>'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

type NotifPrefKey = 'emailWelcome' | 'emailAssignment' | 'emailContentUpdate'

function unsubscribeFooter(): string {
  const prefsLink = `${APP_URL}/profile#notifications`
  return `<p style="margin-top: 20px; font-size: 11px;"><a href="${prefsLink}" style="color: #9CA3AF; text-decoration: underline;">Gérer mes préférences de notification</a></p>`
}

async function shouldSendEmail(email: string, prefKey: NotifPrefKey): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { notificationPreference: { select: { [prefKey]: true } } },
    })
    if (!user?.notificationPreference) return true // default: send
    const value = (user.notificationPreference as Record<string, boolean>)[prefKey]
    return value !== false
  } catch {
    return true // on error, default to sending
  }
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set, email sending is disabled')
    return null
  }
  return new Resend(apiKey)
}

export interface SendInvitationEmailParams {
  to: string
  inviteToken: string
  parcoursTitle: string
  trainerName: string
  expiresAt: Date
}

export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    console.log('Email not sent (Resend not configured):', params.to)
    return { success: true } // Return success to not block the flow
  }

  const { to, inviteToken, parcoursTitle, trainerName, expiresAt } = params

  const inviteLink = `${APP_URL}/invite/${inviteToken}`
  const expirationDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(expiresAt)

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Invitation à la formation: ${parcoursTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation à votre formation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Formation Professionnelle</p>
            </div>

            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">Vous êtes invité(e) à rejoindre une formation</h2>

              <p>${trainerName} vous invite à suivre le parcours de formation:</p>

              <div style="background: white; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #2563EB;">
                <strong style="font-size: 18px; color: #2563EB;">${parcoursTitle}</strong>
              </div>

              <p>Cliquez sur le bouton ci-dessous pour créer votre compte et commencer votre formation:</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Commencer ma formation
                </a>
              </div>

              <p style="color: #6B7280; font-size: 14px;">
                Ce lien expire le <strong>${expirationDate}</strong>.
              </p>
            </div>

            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Vous êtes invité(e) à rejoindre une formation

${trainerName} vous invite à suivre le parcours de formation "${parcoursTitle}".

Cliquez sur ce lien pour créer votre compte et commencer:
${inviteLink}

Ce lien expire le ${expirationDate}.

Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export interface SendWelcomeEmailParams {
  to: string
  parcoursTitles: string[]
  trainerName: string
}

export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams
): Promise<{ success: boolean; error?: string }> {
  if (!(await shouldSendEmail(params.to, 'emailWelcome'))) {
    return { success: true }
  }

  const resend = getResendClient()
  if (!resend) {
    console.log('Email not sent (Resend not configured):', params.to)
    return { success: true }
  }

  const { to, parcoursTitles, trainerName } = params
  const loginLink = `${APP_URL}/login`
  const parcoursList = parcoursTitles.map((t) => `<li style="margin: 5px 0;"><strong>${t}</strong></li>`).join('')

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Bienvenue sur FormaCPV - Vos formations vous attendent',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Formation Professionnelle</p>
            </div>
            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">Bienvenue sur FormaCPV !</h2>
              <p>${trainerName} vous a inscrit aux formations suivantes :</p>
              <ul style="background: white; border-radius: 6px; padding: 15px 15px 15px 30px; margin: 20px 0; border-left: 4px solid #2563EB;">
                ${parcoursList}
              </ul>
              <p>Connectez-vous pour commencer vos formations :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Se connecter
                </a>
              </div>
            </div>
            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              ${unsubscribeFooter()}
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `Bienvenue sur FormaCPV !\n\n${trainerName} vous a inscrit aux formations suivantes :\n${parcoursTitles.map((t) => `- ${t}`).join('\n')}\n\nConnectez-vous pour commencer : ${loginLink}`,
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ─── Trainer welcome email ──────────────────────────────────────────────────

export async function sendTrainerWelcomeEmail(
  params: { to: string }
): Promise<{ success: boolean; error?: string }> {
  if (!(await shouldSendEmail(params.to, 'emailWelcome'))) {
    return { success: true }
  }

  const resend = getResendClient()
  if (!resend) {
    console.log('Email not sent (Resend not configured):', params.to)
    return { success: true }
  }

  const loginLink = `${APP_URL}/login`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.to],
      subject: 'Bienvenue sur FormaCPV - Votre espace formateur est prêt',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Formation Professionnelle</p>
            </div>
            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">Bienvenue en tant que formateur !</h2>
              <p>Vous avez été ajouté comme <strong>formateur</strong> sur la plateforme FormaCPV.</p>
              <p>Vous pouvez dès maintenant :</p>
              <ul style="background: white; border-radius: 6px; padding: 15px 15px 15px 30px; margin: 20px 0; border-left: 4px solid #2563EB;">
                <li style="margin: 5px 0;">Consulter vos parcours de formation</li>
                <li style="margin: 5px 0;">Inviter et suivre vos apprenants</li>
                <li style="margin: 5px 0;">Suivre leur progression en temps réel</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Accéder à mon espace
                </a>
              </div>
            </div>
            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              ${unsubscribeFooter()}
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `Bienvenue sur FormaCPV !\n\nVous avez été ajouté comme formateur sur la plateforme.\n\nConnectez-vous pour accéder à votre espace : ${loginLink}`,
    })

    if (error) {
      console.error('Error sending trainer welcome email:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error('Error sending trainer welcome email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export interface SendParcoursAssignmentEmailParams {
  to: string
  parcoursTitles: string[]
  trainerName: string
}

export async function sendParcoursAssignmentEmail(
  params: SendParcoursAssignmentEmailParams
): Promise<{ success: boolean; error?: string }> {
  if (!(await shouldSendEmail(params.to, 'emailAssignment'))) {
    return { success: true }
  }

  const resend = getResendClient()
  if (!resend) {
    console.log('Email not sent (Resend not configured):', params.to)
    return { success: true }
  }

  const { to, parcoursTitles, trainerName } = params
  const loginLink = `${APP_URL}/login`
  const parcoursList = parcoursTitles.map((t) => `<li style="margin: 5px 0;"><strong>${t}</strong></li>`).join('')
  const subject = parcoursTitles.length === 1
    ? `Nouvelle formation assignée : ${parcoursTitles[0]}`
    : `${parcoursTitles.length} nouvelles formations assignées`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Formation Professionnelle</p>
            </div>
            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">Nouvelle formation disponible</h2>
              <p>${trainerName} vous a assigné de nouvelles formations :</p>
              <ul style="background: white; border-radius: 6px; padding: 15px 15px 15px 30px; margin: 20px 0; border-left: 4px solid #10B981;">
                ${parcoursList}
              </ul>
              <p>Connectez-vous pour commencer :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Accéder à mes formations
                </a>
              </div>
            </div>
            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              ${unsubscribeFooter()}
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `Nouvelle formation disponible\n\n${trainerName} vous a assigné de nouvelles formations :\n${parcoursTitles.map((t) => `- ${t}`).join('\n')}\n\nConnectez-vous pour commencer : ${loginLink}`,
    })

    if (error) {
      console.error('Error sending parcours assignment email:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error('Error sending parcours assignment email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export interface BulkEmailResult {
  email: string
  success: boolean
  error?: string
}

export async function sendBulkInvitationEmails(
  invitations: SendInvitationEmailParams[]
): Promise<BulkEmailResult[]> {
  const results: BulkEmailResult[] = []

  // Send emails sequentially to avoid rate limits
  for (const invitation of invitations) {
    const result = await sendInvitationEmail(invitation)
    results.push({
      email: invitation.to,
      success: result.success,
      error: result.error,
    })

    // Small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return results
}

// ─── Content update notification email ──────────────────────────────────────

export interface SendContentUpdateEmailParams {
  to: string
  contentType: 'module' | 'parcours'
  contentTitle: string
  parcoursTitle?: string
}

export async function sendContentUpdateEmail(
  params: SendContentUpdateEmailParams
): Promise<{ success: boolean; error?: string }> {
  if (!(await shouldSendEmail(params.to, 'emailContentUpdate'))) {
    return { success: true }
  }

  const resend = getResendClient()
  if (!resend) {
    console.log('Email not sent (Resend not configured):', params.to)
    return { success: true }
  }

  const { to, contentType, contentTitle, parcoursTitle } = params
  const loginLink = `${APP_URL}/login`
  const isModule = contentType === 'module'
  const subject = isModule
    ? `Module mis à jour : ${contentTitle}`
    : `Parcours mis à jour : ${contentTitle}`

  const description = isModule && parcoursTitle
    ? `Le module <strong>${contentTitle}</strong> du parcours <strong>${parcoursTitle}</strong> a été mis à jour.`
    : isModule
    ? `Le module <strong>${contentTitle}</strong> a été mis à jour.`
    : `Le parcours <strong>${contentTitle}</strong> a été mis à jour.`

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Formation Professionnelle</p>
            </div>
            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">Contenu mis à jour</h2>
              <p>${description}</p>
              <p style="color: #6B7280;">De nouvelles informations sont disponibles. Connectez-vous pour consulter les changements.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Voir les mises à jour
                </a>
              </div>
            </div>
            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              ${unsubscribeFooter()}
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `Contenu mis à jour\n\n${description.replace(/<[^>]*>/g, '')}\n\nConnectez-vous pour consulter : ${loginLink}`,
    })

    if (error) {
      console.error('Error sending content update email:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error('Error sending content update email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ─── Contact / support email ────────────────────────────────────────────────

export interface SendContactEmailParams {
  to: string
  fromName: string
  fromEmail: string
  fromRole: string
  subject: string
  message: string
}

export async function sendContactEmail(
  params: SendContactEmailParams
): Promise<{ success: boolean; error?: string }> {
  const resend = getResendClient()
  if (!resend) {
    console.log('Email not sent (Resend not configured):', params.to)
    return { success: true }
  }

  const { to, fromName, fromEmail, fromRole, subject, message } = params
  const roleLabel = fromRole === 'ADMIN' ? 'Administrateur' : fromRole === 'TRAINER' ? 'Formateur' : 'Apprenant'
  const escapedMessage = message.replace(/\n/g, '<br>')

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: fromEmail,
      subject: `[FormaCPV] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Message de support</p>
            </div>
            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">${subject}</h2>
              <div style="background: white; border-radius: 6px; padding: 15px; margin: 20px 0; border-left: 4px solid #2563EB;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
                  <strong>${fromName}</strong> (${roleLabel}) — <a href="mailto:${fromEmail}" style="color: #2563EB;">${fromEmail}</a>
                </p>
                <p style="margin: 0; white-space: pre-wrap;">${escapedMessage}</p>
              </div>
              <p style="color: #6B7280; font-size: 13px;">
                Vous pouvez répondre directement à cet email pour contacter ${fromName}.
              </p>
            </div>
            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `Message de ${fromName} (${roleLabel} - ${fromEmail})\n\nSujet : ${subject}\n\n${message}\n\nRépondez directement à cet email pour contacter ${fromName}.`,
    })

    if (error) {
      console.error('Error sending contact email:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    console.error('Error sending contact email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendContentUpdateEmailBulk(
  recipients: string[],
  params: Omit<SendContentUpdateEmailParams, 'to'>
): Promise<void> {
  for (const to of recipients) {
    await sendContentUpdateEmail({ ...params, to })
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}
