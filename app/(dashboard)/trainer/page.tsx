import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getTrainerStats, getTrainerLearners } from '@/lib/services/trainer.service'
import { prisma } from '@/lib/db'
import { StatsCards } from '@/components/trainer/StatsCards'
import { TrainerDashboardClient } from '@/components/trainer/TrainerDashboardClient'
import { Users } from 'lucide-react'

export default async function TrainerDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const [stats, learners, parcoursList] = await Promise.all([
    getTrainerStats(session.user.id),
    getTrainerLearners(session.user.id),
    prisma.parcours.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Suivez la progression de vos apprenants
        </p>
      </div>

      <StatsCards
        totalInvited={stats.totalInvited}
        totalConnected={stats.totalConnected}
        avgCompletion={stats.avgCompletion}
      />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          Mes apprenants
        </h2>
        <TrainerDashboardClient
          initialLearners={learners}
          parcoursList={parcoursList}
        />
      </div>
    </div>
  )
}
