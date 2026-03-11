import { notFound } from 'next/navigation'
import { InviteForm } from './InviteForm'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

async function validateToken(token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${baseUrl}/api/invitations/${token}/validate`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const validation = await validateToken(token)

  if (!validation) {
    notFound()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <InviteForm
        token={token}
        parcours={validation.parcours}
        trainer={validation.trainer}
        prefillEmail={validation.email}
      />
    </div>
  )
}
