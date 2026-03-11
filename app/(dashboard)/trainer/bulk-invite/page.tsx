import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { BulkInvitePageClient } from '@/components/trainer/BulkInvitePageClient'

export default async function BulkInvitePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const parcoursList = await prisma.parcours.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import en masse</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Importez un fichier CSV pour inviter plusieurs apprenants
        </p>
      </div>

      <BulkInvitePageClient parcoursList={parcoursList} />
    </div>
  )
}
