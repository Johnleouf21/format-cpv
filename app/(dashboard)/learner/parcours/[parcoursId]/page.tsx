import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserParcours } from '@/lib/services/parcours.service'
import { prisma } from '@/lib/db'
import { WelcomeCard } from '@/components/learner/WelcomeCard'
import { ProgressIndicator } from '@/components/learner/ProgressIndicator'
import { ModuleList } from '@/components/learner/ModuleList'
import { CertificateDownloadButton } from '@/components/learner/CertificateDownloadButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Trophy, PartyPopper } from 'lucide-react'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'

interface PageProps {
  params: Promise<{ parcoursId: string }>
}

export default async function LearnerParcoursPage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { parcoursId } = await params

  // Verify user has access to this parcours
  const hasAccess = await prisma.userParcours.findUnique({
    where: { userId_parcoursId: { userId: session.user.id, parcoursId } },
  })

  // Fallback: check legacy parcoursId
  if (!hasAccess) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { parcoursId: true },
    })
    if (user?.parcoursId !== parcoursId) {
      redirect('/learner')
    }
  }

  try {
    const data = await getUserParcours(session.user.id, parcoursId)
    const isParcoursCompleted = data.progress.completed === data.progress.total && data.progress.total > 0

    return (
      <div className="space-y-6">
        <PageBreadcrumb items={[
          { label: 'Mes formations', href: '/learner' },
          { label: data.parcours.title },
        ]} />

        <WelcomeCard
          userName={data.user.name}
          parcoursTitle={data.parcours.title}
        />

        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <ProgressIndicator
            completed={data.progress.completed}
            total={data.progress.total}
          />

          {data.nextModule && (
            <div className="mt-6">
              <Button asChild size="lg" className="w-full">
                <Link href={`/learner/modules/${data.nextModule.id}`}>
                  {data.progress.completed === 0 ? 'Commencer' : 'Continuer'}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {isParcoursCompleted && (
          <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex items-center justify-center gap-4">
                <PartyPopper className="h-10 w-10 text-yellow-500" />
                <Trophy className="h-12 w-12 text-yellow-500" />
                <PartyPopper className="h-10 w-10 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                Félicitations !
              </CardTitle>
              <CardDescription className="text-green-600 text-lg">
                Vous avez terminé tous les modules de ce parcours.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Téléchargez votre certificat de réussite pour attester de votre formation.
              </p>
              <CertificateDownloadButton parcoursId={parcoursId} />
            </CardContent>
          </Card>
        )}

        <ModuleList modules={data.modules} />
      </div>
    )
  } catch {
    redirect('/learner')
  }
}
