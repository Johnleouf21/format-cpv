import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TrainerLearnersPageClient } from '@/components/trainer/TrainerLearnersPageClient'
import { prisma } from '@/lib/db'

export default async function TrainerLearnersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const parcoursList = await prisma.parcours.findMany({
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  return (
    <TrainerLearnersPageClient
      parcoursList={parcoursList}
      trainerId={session.user.id}
      trainerName={session.user.name || ''}
    />
  )
}
