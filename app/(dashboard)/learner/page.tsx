import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserParcours } from '@/lib/services/parcours.service'
import { WelcomeCard } from '@/components/learner/WelcomeCard'
import { ProgressIndicator } from '@/components/learner/ProgressIndicator'
import { ModuleList } from '@/components/learner/ModuleList'
import { CertificateDownloadButton } from '@/components/learner/CertificateDownloadButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Trophy, PartyPopper } from 'lucide-react'

export default async function LearnerHomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  try {
    const data = await getUserParcours(session.user.id)
    const isParcoursCompleted = data.progress.completed === data.progress.total && data.progress.total > 0

    return (
      <div className="space-y-6">
        <WelcomeCard
          userName={data.user.name}
          parcoursTitle={data.parcours.title}
        />

        <div className="bg-white rounded-lg p-6 shadow-sm">
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

        {/* Completion celebration and certificate */}
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
                Vous avez terminé tous les modules de votre parcours.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Téléchargez votre certificat de réussite pour attester de votre formation.
              </p>
              <CertificateDownloadButton />
            </CardContent>
          </Card>
        )}

        <ModuleList modules={data.modules} />
      </div>
    )
  } catch {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-red-600">
          Aucun parcours assigné
        </h1>
        <p className="text-muted-foreground mt-2">
          Contactez votre formateur pour être assigné à un parcours.
        </p>
      </div>
    )
  }
}
