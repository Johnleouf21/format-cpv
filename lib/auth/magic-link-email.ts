interface SendVerificationRequestParams {
  identifier: string
  url: string
  provider: {
    apiKey?: string
    from?: string
  }
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'FormaCPV <onboarding@resend.dev>'

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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563EB; margin: 0;">FormaCPV</h1>
              <p style="color: #6B7280; margin: 5px 0 0;">Formation Professionnelle</p>
            </div>

            <div style="background: #F9FAFB; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1F2937;">Connexion à votre compte</h2>
              <p>Cliquez sur le bouton ci-dessous pour vous connecter :</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; background: #2563EB; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Se connecter
                </a>
              </div>

              <p style="color: #6B7280; font-size: 14px;">
                Ce lien expire dans 15 minutes. Si vous n'avez pas demandé cette connexion, ignorez cet email.
              </p>
            </div>

            <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
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
