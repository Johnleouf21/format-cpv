import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserParcours, getUserParcoursAssignments } from '@/lib/services/parcours.service'
import { WelcomeCard } from '@/components/learner/WelcomeCard'
import { ProgressIndicator } from '@/components/learner/ProgressIndicator'
import { ModuleList } from '@/components/learner/ModuleList'
import { CertificateDownloadButton } from '@/components/learner/CertificateDownloadButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Trophy, PartyPopper, BookOpen, ArrowRight } from 'lucide-react'

export default async function LearnerHomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  try {
    const assignments = await getUserParcoursAssignments(session.user.id)

    // No parcours assigned
    if (assignments.length === 0) {
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

    // Multiple parcours — show list view
    if (assignments.length > 1) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Mes formations</h1>
            <p className="text-muted-foreground">
              Vous avez {assignments.length} formations en cours
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((parcours) => {
              const percent = parcours.totalModules > 0
                ? Math.round((parcours.completedModules / parcours.totalModules) * 100)
                : 0
              const isCompleted = parcours.totalModules > 0 && parcours.completedModules === parcours.totalModules

              return (
                <Card key={parcours.id} className={isCompleted ? 'border-green-300 bg-green-50/50' : ''}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                        {isCompleted ? (
                          <Trophy className="h-5 w-5 text-green-600" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{parcours.title}</CardTitle>
                        <CardDescription>
                          {parcours.completedModules}/{parcours.totalModules} modules
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-600'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{percent}%</span>
                      </div>
                      <Button asChild className="w-full" variant={isCompleted ? 'outline' : 'default'}>
                        <Link href={`/learner/parcours/${parcours.id}`}>
                          {isCompleted ? 'Revoir' : parcours.completedModules === 0 ? 'Commencer' : 'Continuer'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )
    }

    // Single parcours — show detailed view (original behavior)
    const data = await getUserParcours(session.user.id, assignments[0].id)
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
              <CertificateDownloadButton parcoursId={data.parcours.id} />
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
