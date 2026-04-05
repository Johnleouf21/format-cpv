const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const LOGO_URL = `${APP_URL}/logo-pointvision.png`
const PV_BLUE = '#2B4C7E'
const PV_BLUE_LIGHT = '#7EADD4'
const PV_BLUE_DARK = '#1E3A5F'

function unsubscribeFooter(): string {
  const prefsLink = `${APP_URL}/profile#notifications`
  return `<p style="margin-top: 20px; font-size: 11px;"><a href="${prefsLink}" style="color: #9CA3AF; text-decoration: underline;">Gérer mes préférences de notification</a></p>`
}

function layout(content: string, footer?: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC;">
    <div style="background: linear-gradient(135deg, ${PV_BLUE}, ${PV_BLUE_DARK}); border-radius: 12px 12px 0 0; padding: 28px 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="Point Vision" width="52" height="52" style="border-radius: 10px; margin-bottom: 10px;" />
      <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 0.5px;">FormaCPV</h1>
      <p style="color: ${PV_BLUE_LIGHT}; margin: 6px 0 0; font-size: 13px; letter-spacing: 0.3px;">Plateforme de formation &mdash; Groupe Point Vision</p>
    </div>
    <div style="background: white; border-radius: 0 0 12px 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #E2E8F0; border-top: none;">
      ${content}
    </div>
    <div style="text-align: center; color: #9CA3AF; font-size: 12px; padding: 0 20px;">
      ${footer || ''}
      <p style="margin-top: 12px;">L'ophtalmologie de pointe &mdash; Groupe Point Vision</p>
      <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
    </div>
  </body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<div style="text-align: center; margin: 30px 0;">
  <a href="${href}" style="display: inline-block; background: ${PV_BLUE}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
    ${label}
  </a>
</div>`
}

function listBlock(items: string[], borderColor = PV_BLUE): string {
  const lis = items.map((t) => `<li style="margin: 5px 0;"><strong>${t}</strong></li>`).join('')
  return `<ul style="background: #F8FAFC; border-radius: 8px; padding: 15px 15px 15px 30px; margin: 20px 0; border-left: 4px solid ${borderColor};">
  ${lis}
</ul>`
}

// ─── Templates ──────────────────────────────────────────────────────────────

export function invitationTemplate(p: {
  inviteLink: string
  parcoursTitle: string
  trainerName: string
  expirationDate: string
}): { html: string; text: string } {
  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Vous êtes invité(e) à rejoindre une formation</h2>
    <p>${p.trainerName} vous invite à suivre le parcours de formation :</p>
    <div style="background: #F8FAFC; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid ${PV_BLUE};">
      <strong style="font-size: 18px; color: ${PV_BLUE};">${p.parcoursTitle}</strong>
    </div>
    <p>Cliquez sur le bouton ci-dessous pour créer votre compte et commencer votre formation :</p>
    ${ctaButton(p.inviteLink, 'Commencer ma formation')}
    <p style="color: #6B7280; font-size: 14px;">
      Ce lien expire le <strong>${p.expirationDate}</strong>.
    </p>
  `, `<p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>`)

  const text = `Vous êtes invité(e) à rejoindre une formation\n\n${p.trainerName} vous invite à suivre le parcours de formation "${p.parcoursTitle}".\n\nCliquez sur ce lien pour créer votre compte et commencer:\n${p.inviteLink}\n\nCe lien expire le ${p.expirationDate}.\n\nSi vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.`

  return { html, text }
}

export function welcomeTemplate(p: {
  parcoursTitles: string[]
  trainerName: string
  loginLink: string
}): { html: string; text: string } {
  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Bienvenue sur FormaCPV !</h2>
    <p>${p.trainerName} vous a inscrit aux formations suivantes :</p>
    ${listBlock(p.parcoursTitles)}
    <p>Connectez-vous pour commencer vos formations :</p>
    ${ctaButton(p.loginLink, 'Se connecter')}
  `, unsubscribeFooter())

  const text = `Bienvenue sur FormaCPV !\n\n${p.trainerName} vous a inscrit aux formations suivantes :\n${p.parcoursTitles.map((t) => `- ${t}`).join('\n')}\n\nConnectez-vous pour commencer : ${p.loginLink}`

  return { html, text }
}

export function trainerWelcomeTemplate(p: {
  loginLink: string
}): { html: string; text: string } {
  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Bienvenue en tant que formateur !</h2>
    <p>Vous avez été ajouté comme <strong>formateur</strong> sur la plateforme FormaCPV.</p>
    <p>Vous pouvez dès maintenant :</p>
    <ul style="background: #F8FAFC; border-radius: 8px; padding: 15px 15px 15px 30px; margin: 20px 0; border-left: 4px solid ${PV_BLUE};">
      <li style="margin: 5px 0;">Consulter vos parcours de formation</li>
      <li style="margin: 5px 0;">Inviter et suivre vos apprenants</li>
      <li style="margin: 5px 0;">Suivre leur progression en temps réel</li>
    </ul>
    ${ctaButton(p.loginLink, 'Accéder à mon espace')}
  `, unsubscribeFooter())

  const text = `Bienvenue sur FormaCPV !\n\nVous avez été ajouté comme formateur sur la plateforme.\n\nConnectez-vous pour accéder à votre espace : ${p.loginLink}`

  return { html, text }
}

export function parcoursAssignmentTemplate(p: {
  parcoursTitles: string[]
  trainerName: string
  loginLink: string
}): { html: string; text: string } {
  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Nouvelle formation disponible</h2>
    <p>${p.trainerName} vous a assigné de nouvelles formations :</p>
    ${listBlock(p.parcoursTitles, '#10B981')}
    <p>Connectez-vous pour commencer :</p>
    ${ctaButton(p.loginLink, 'Accéder à mes formations')}
  `, unsubscribeFooter())

  const text = `Nouvelle formation disponible\n\n${p.trainerName} vous a assigné de nouvelles formations :\n${p.parcoursTitles.map((t) => `- ${t}`).join('\n')}\n\nConnectez-vous pour commencer : ${p.loginLink}`

  return { html, text }
}

export function contentUpdateTemplate(p: {
  description: string
  loginLink: string
}): { html: string; text: string } {
  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Contenu mis à jour</h2>
    <p>${p.description}</p>
    <p style="color: #6B7280;">De nouvelles informations sont disponibles. Connectez-vous pour consulter les changements.</p>
    ${ctaButton(p.loginLink, 'Voir les mises à jour')}
  `, unsubscribeFooter())

  const text = `Contenu mis à jour\n\n${p.description.replace(/<[^>]*>/g, '')}\n\nConnectez-vous pour consulter : ${p.loginLink}`

  return { html, text }
}

export function contactTemplate(p: {
  subject: string
  fromName: string
  fromEmail: string
  roleLabel: string
  escapedMessage: string
}): { html: string; text: string } {
  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">${p.subject}</h2>
    <div style="background: #F8FAFC; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid ${PV_BLUE};">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">
        <strong>${p.fromName}</strong> (${p.roleLabel}) — <a href="mailto:${p.fromEmail}" style="color: ${PV_BLUE};">${p.fromEmail}</a>
      </p>
      <p style="margin: 0; white-space: pre-wrap;">${p.escapedMessage}</p>
    </div>
    <p style="color: #6B7280; font-size: 13px;">
      Vous pouvez répondre directement à cet email pour contacter ${p.fromName}.
    </p>
  `)

  const text = `Message de ${p.fromName} (${p.roleLabel} - ${p.fromEmail})\n\nSujet : ${p.subject}\n\n${p.escapedMessage.replace(/<br>/g, '\n')}\n\nRépondez directement à cet email pour contacter ${p.fromName}.`

  return { html, text }
}

export function reminderTemplate(p: {
  learnerName: string
  daysSinceLastActivity: number
  completedModules: number
  totalModules: number
  parcoursTitle: string
}): { html: string; text: string } {
  const progressPercent = p.totalModules > 0 ? Math.round((p.completedModules / p.totalModules) * 100) : 0
  const loginUrl = `${APP_URL}/learner`

  const html = layout(`
    <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Vos formations vous attendent !</h2>
    <p>Bonjour <strong>${p.learnerName}</strong>,</p>
    <p>Cela fait <strong>${p.daysSinceLastActivity} jour${p.daysSinceLastActivity > 1 ? 's' : ''}</strong> que vous ne vous êtes pas connecté à FormaCPV.</p>
    <div style="background: #F8FAFC; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0; font-weight: bold; color: ${PV_BLUE_DARK};">${p.parcoursTitle}</p>
      <p style="margin: 0; color: #6B7280;">
        ${p.completedModules}/${p.totalModules} modules complétés (${progressPercent}%)
      </p>
      <div style="background: #E2E8F0; border-radius: 999px; height: 8px; margin-top: 10px;">
        <div style="background: ${PV_BLUE}; border-radius: 999px; height: 8px; width: ${progressPercent}%;"></div>
      </div>
    </div>
    <p>Continuez votre progression et terminez votre parcours !</p>
    ${ctaButton(loginUrl, 'Reprendre ma formation')}
  `, unsubscribeFooter())

  const text = `Bonjour ${p.learnerName},\n\nCela fait ${p.daysSinceLastActivity} jours que vous ne vous êtes pas connecté à FormaCPV.\n\n${p.parcoursTitle} : ${p.completedModules}/${p.totalModules} modules (${progressPercent}%)\n\nReprenez votre formation : ${loginUrl}`

  return { html, text }
}
