import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getTrainerInvitations } from '@/lib/services/invitation.service'
import { InvitePageClient } from '@/components/trainer/InvitePageClient'

export default async function InvitePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [parcoursList, invitations] = await Promise.all([
    prisma.parcours.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    getTrainerInvitations(session.user.id),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inviter un apprenant</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Générez un lien d&apos;invitation pour un nouvel apprenant
        </p>
      </div>

      <InvitePageClient
        parcoursList={parcoursList}
        initialInvitations={invitations}
      />
    </div>
  )
}
