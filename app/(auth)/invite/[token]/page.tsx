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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2B4C7E] via-[#3A5F96] to-[#1E3A5F] px-4">
      <InviteForm
        token={token}
        parcours={validation.parcours}
        trainer={validation.trainer}
        prefillEmail={validation.email}
      />
    </div>
  )
}
