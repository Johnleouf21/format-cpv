import { Resend } from 'resend'
import { prisma } from '@/lib/db'
import {
  invitationTemplate,
  welcomeTemplate,
  trainerWelcomeTemplate,
  parcoursAssignmentTemplate,
  contentUpdateTemplate,
  contactTemplate,
  reminderTemplate,
} from './email-templates'

const FROM_EMAIL = process.env.EMAIL_FROM || 'FormaCPV <onboarding@resend.dev>'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

type NotifPrefKey = 'emailWelcome' | 'emailAssignment' | 'emailContentUpdate'

async function shouldSendEmail(email: string, prefKey: NotifPrefKey): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { notificationPreference: { select: { [prefKey]: true } } },
    })
    if (!user?.notificationPreference) return true
    const value = (user.notificationPreference as Record<string, boolean>)[prefKey]
    return value !== false
  } catch {
    return true
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

type EmailResult = { success: boolean; error?: string }

/**
 * Helper pour envoyer un email via Resend avec gestion d'erreur centralisée.
 */
async function sendEmail(config: {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
}): Promise<EmailResult> {
  const resend = getResendClient()
  if (!resend) {
    return { success: true }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [config.to],
      subject: config.subject,
      html: config.html,
      text: config.text,
      ...(config.replyTo && { replyTo: [config.replyTo] }),
    })
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.error('Email send error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ─── Send helpers ───────────────────────────────────────────────────────────

export interface SendInvitationEmailParams {
  to: string
  inviteToken: string
  parcoursTitle: string
  trainerName: string
  expiresAt: Date
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<EmailResult> {
  const { to, inviteToken, parcoursTitle, trainerName, expiresAt } = params
  const inviteLink = `${APP_URL}/invite/${inviteToken}`
  const expirationDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(expiresAt)

  const { html, text } = invitationTemplate({ inviteLink, parcoursTitle, trainerName, expirationDate })

  return sendEmail({ to, subject: `Invitation à la formation: ${parcoursTitle}`, html, text })
}

export interface SendWelcomeEmailParams {
  to: string
  parcoursTitles: string[]
  trainerName: string
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<EmailResult> {
  if (!(await shouldSendEmail(params.to, 'emailWelcome'))) return { success: true }

  const loginLink = `${APP_URL}/login`
  const { html, text } = welcomeTemplate({ parcoursTitles: params.parcoursTitles, trainerName: params.trainerName, loginLink })

  return sendEmail({ to: params.to, subject: 'Bienvenue sur FormaCPV - Vos formations vous attendent', html, text })
}

export async function sendTrainerWelcomeEmail(params: { to: string }): Promise<EmailResult> {
  if (!(await shouldSendEmail(params.to, 'emailWelcome'))) return { success: true }

  const loginLink = `${APP_URL}/login`
  const { html, text } = trainerWelcomeTemplate({ loginLink })

  return sendEmail({ to: params.to, subject: 'Bienvenue sur FormaCPV - Votre espace formateur est prêt', html, text })
}

export interface SendParcoursAssignmentEmailParams {
  to: string
  parcoursTitles: string[]
  trainerName: string
}

export async function sendParcoursAssignmentEmail(params: SendParcoursAssignmentEmailParams): Promise<EmailResult> {
  if (!(await shouldSendEmail(params.to, 'emailAssignment'))) return { success: true }

  const { to, parcoursTitles, trainerName } = params
  const loginLink = `${APP_URL}/login`
  const subject = parcoursTitles.length === 1
    ? `Nouvelle formation assignée : ${parcoursTitles[0]}`
    : `${parcoursTitles.length} nouvelles formations assignées`

  const { html, text } = parcoursAssignmentTemplate({ parcoursTitles, trainerName, loginLink })

  return sendEmail({ to, subject, html, text })
}

export interface BulkEmailResult {
  email: string
  success: boolean
  error?: string
}

export async function sendBulkInvitationEmails(invitations: SendInvitationEmailParams[]): Promise<BulkEmailResult[]> {
  const results: BulkEmailResult[] = []
  for (const invitation of invitations) {
    const result = await sendInvitationEmail(invitation)
    results.push({ email: invitation.to, success: result.success, error: result.error })
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return results
}

export interface SendContentUpdateEmailParams {
  to: string
  contentType: 'module' | 'parcours'
  contentTitle: string
  parcoursTitle?: string
}

export async function sendContentUpdateEmail(params: SendContentUpdateEmailParams): Promise<EmailResult> {
  if (!(await shouldSendEmail(params.to, 'emailContentUpdate'))) return { success: true }

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

  const { html, text } = contentUpdateTemplate({ description, loginLink })

  return sendEmail({ to, subject, html, text })
}

export interface SendContactEmailParams {
  to: string
  fromName: string
  fromEmail: string
  fromRole: string
  subject: string
  message: string
}

export async function sendContactEmail(params: SendContactEmailParams): Promise<EmailResult> {
  const { to, fromName, fromEmail, fromRole, subject, message } = params
  const roleLabel = fromRole === 'ADMIN' ? 'Administrateur' : fromRole === 'TRAINER' ? 'Formateur' : 'Apprenant'
  const escapedMessage = message.replace(/\n/g, '<br>')

  const { html, text } = contactTemplate({ subject, fromName, fromEmail, roleLabel, escapedMessage })

  return sendEmail({ to, subject: `[FormaCPV] ${subject}`, html, text, replyTo: fromEmail })
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

interface SendReminderEmailParams {
  to: string
  learnerName: string
  daysSinceLastActivity: number
  completedModules: number
  totalModules: number
  parcoursTitle: string
}

export async function sendReminderEmail(params: SendReminderEmailParams): Promise<EmailResult> {
  const { html, text } = reminderTemplate({
    learnerName: params.learnerName,
    daysSinceLastActivity: params.daysSinceLastActivity,
    completedModules: params.completedModules,
    totalModules: params.totalModules,
    parcoursTitle: params.parcoursTitle,
  })

  return sendEmail({ to: params.to, subject: 'Vos formations vous attendent sur FormaCPV !', html, text })
}
