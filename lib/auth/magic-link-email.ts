interface SendVerificationRequestParams {
  identifier: string
  url: string
  provider: {
    apiKey?: string
    from?: string
  }
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'FormaCPV <onboarding@resend.dev>'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const LOGO_URL = `${APP_URL}/logo-pointvision.png`
const PV_BLUE = '#2B4C7E'
const PV_BLUE_LIGHT = '#7EADD4'
const PV_BLUE_DARK = '#1E3A5F'

export async function sendMagicLinkEmail(
  params: SendVerificationRequestParams
): Promise<void> {
  const { identifier: to, url, provider } = params

  console.log('[MagicLink] Sending to:', to)
  console.log('[MagicLink] API Key present:', !!provider.apiKey)
  console.log('[MagicLink] From:', provider.from)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: provider.from || FROM_EMAIL,
      to,
      subject: 'Connexion à FormaCPV',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Connexion FormaCPV</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F8FAFC;">
            <div style="background: linear-gradient(135deg, ${PV_BLUE}, ${PV_BLUE_DARK}); border-radius: 12px 12px 0 0; padding: 28px 24px; text-align: center;">
              <img src="${LOGO_URL}" alt="Point Vision" width="52" height="52" style="border-radius: 10px; margin-bottom: 10px;" />
              <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 0.5px;">FormaCPV</h1>
              <p style="color: ${PV_BLUE_LIGHT}; margin: 6px 0 0; font-size: 13px; letter-spacing: 0.3px;">Plateforme de formation &mdash; Groupe Point Vision</p>
            </div>

            <div style="background: white; border-radius: 0 0 12px 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #E2E8F0; border-top: none;">
              <h2 style="margin-top: 0; color: ${PV_BLUE_DARK};">Connexion à votre compte</h2>
              <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; background: ${PV_BLUE}; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Se connecter
                </a>
              </div>

              <p style="color: #6B7280; font-size: 14px;">
                Ce lien expire dans 15 minutes. Si vous n'avez pas demandé cette connexion, ignorez cet email.
              </p>
            </div>

            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
              <p>L'ophtalmologie de pointe &mdash; Groupe Point Vision</p>
              <p>&copy; ${new Date().getFullYear()} FormaCPV. Tous droits réservés.</p>
            </div>
          </body>
        </html>
      `,
      text: `Connexion à FormaCPV\n\nCliquez sur ce lien pour vous connecter :\n${url}\n\nCe lien expire dans 15 minutes.\nSi vous n'avez pas demandé cette connexion, ignorez cet email.`,
    }),
  })

  const responseData = await res.json()
  console.log('[MagicLink] Resend response:', res.status, JSON.stringify(responseData))

  if (!res.ok) {
    throw new Error('Erreur envoi email: ' + JSON.stringify(responseData))
  }
}
