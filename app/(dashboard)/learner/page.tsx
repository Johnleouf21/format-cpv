import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserParcours, getUserParcoursAssignments } from '@/lib/services/parcours.service'
import { getUserBadges } from '@/lib/services/badge.service'
import { prisma } from '@/lib/db'
import { WelcomeCard } from '@/components/learner/WelcomeCard'
import { ModuleList } from '@/components/learner/ModuleList'
import { CertificateDownloadButton } from '@/components/learner/CertificateDownloadButton'
import { BadgesSection } from '@/components/learner/BadgesSection'
import { XPCard } from '@/components/learner/XPCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Trophy,
  PartyPopper,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Clock,
  Award,
  Target,
} from 'lucide-react'

async function getLearnerStats(userId: string) {
  const [completedModules, quizResults, totalAssignments] = await Promise.all([
    prisma.progress.count({ where: { userId } }),
    prisma.quizResult.findMany({
      where: { progress: { userId } },
      select: { score: true, totalQuestions: true },
    }),
    prisma.userParcours.count({ where: { userId } }),
  ])

  const quizzesTaken = quizResults.length
  const avgScore = quizzesTaken > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + q.score, 0) / quizzesTaken)
    : 0

  return { completedModules, quizzesTaken, avgScore, totalAssignments }
}

export default async function LearnerHomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  try {
    const assignments = await getUserParcoursAssignments(session.user.id)

    // No parcours assigned — welcoming onboarding
    if (assignments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-6">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            Bienvenue{session.user.name ? `, ${session.user.name}` : ''} !
          </h1>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Votre compte est bien actif. Un formateur va bientôt vous assigner
            une ou plusieurs formations.
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Vous recevrez un email de notification dès qu&apos;une formation vous sera attribuée.
          </p>
        </div>
      )
    }

    const [stats, earnedBadges] = await Promise.all([
      getLearnerStats(session.user.id),
      getUserBadges(session.user.id),
    ])

    // Multiple parcours — dashboard view
    if (assignments.length > 1) {
      const totalModules = assignments.reduce((sum, a) => sum + a.totalModules, 0)
      const totalCompleted = assignments.reduce((sum, a) => sum + a.completedModules, 0)
      const globalPercent = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0
      const completedParcours = assignments.filter(
        (a) => a.totalModules > 0 && a.completedModules === a.totalModules
      ).length

      // Find the next parcours to continue (first non-completed with progress, or first non-started)
      const inProgress = assignments.find(
        (a) => a.completedModules > 0 && a.completedModules < a.totalModules
      )
      const notStarted = assignments.find((a) => a.completedModules === 0 && a.totalModules > 0)
      const nextParcours = inProgress || notStarted

      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Bonjour{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''} !
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Voici un aperçu de vos formations
            </p>
          </div>

          {/* Stats cards */}
          <div id="stats" data-tour="stats" className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                    <Target className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold">{globalPercent}%</p>
                    <p className="text-xs text-muted-foreground">Progression globale</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 shrink-0">
                    <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold">{totalCompleted}/{totalModules}</p>
                    <p className="text-xs text-muted-foreground">Modules complétés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 shrink-0">
                    <Award className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold">{stats.avgScore > 0 ? `${stats.avgScore}%` : '-'}</p>
                    <p className="text-xs text-muted-foreground">Score moyen quiz</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                    <Trophy className="h-4.5 w-4.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold">{completedParcours}/{assignments.length}</p>
                    <p className="text-xs text-muted-foreground">Parcours terminés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* XP Card */}
          <XPCard />

          {/* Resume card */}
          {nextParcours && (
            <Card data-tour="resume" className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {inProgress ? 'Reprendre votre formation' : 'Commencer une formation'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{nextParcours.title}</p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0">
                    <Link href={`/learner/parcours/${nextParcours.id}`}>
                      {inProgress ? 'Continuer' : 'Commencer'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parcours list */}
          <div id="certificates" data-tour="modules">
            <h2 className="text-lg font-semibold mb-3">Mes formations</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {assignments.map((parcours) => {
                const percent = parcours.totalModules > 0
                  ? Math.round((parcours.completedModules / parcours.totalModules) * 100)
                  : 0
                const isCompleted = parcours.totalModules > 0 && parcours.completedModules === parcours.totalModules

                return (
                  <Card key={parcours.id} className={isCompleted ? 'border-green-300 bg-green-50/50 dark:bg-green-950/50 dark:border-green-800' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {isCompleted ? (
                            <Trophy className="h-5 w-5 text-green-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{parcours.title}</CardTitle>
                          <CardDescription>
                            {parcours.completedModules}/{parcours.totalModules} modules
                          </CardDescription>
                        </div>
                        {isCompleted && (
                          <Badge className="bg-green-600 shrink-0">Terminé</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Progress value={percent} className={`flex-1 h-2 ${isCompleted ? '[&>[data-slot=progress-indicator]]:bg-green-500' : ''}`} />
                          <span className="text-sm font-medium text-muted-foreground">{percent}%</span>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild className="flex-1" variant={isCompleted ? 'outline' : 'default'} size="sm">
                            <Link href={`/learner/parcours/${parcours.id}`}>
                              {isCompleted ? 'Revoir' : parcours.completedModules === 0 ? 'Commencer' : 'Continuer'}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          {isCompleted && (
                            <CertificateDownloadButton parcoursId={parcours.id} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Badges */}
          <BadgesSection
            stats={{
              completedModules: totalCompleted,
              quizzesTaken: stats.quizzesTaken,
              avgScore: stats.avgScore,
              completedParcours,
              totalParcours: assignments.length,
            }}
            earnedBadges={earnedBadges.map((b) => ({ badgeType: b.badgeType, earnedAt: b.earnedAt.toISOString() }))}
          />
        </div>
      )
    }

    // Single parcours — show detailed view
    const data = await getUserParcours(session.user.id, assignments[0].id)
    const isParcoursCompleted = data.progress.completed === data.progress.total && data.progress.total > 0
    const percent = data.progress.total > 0
      ? Math.round((data.progress.completed / data.progress.total) * 100)
      : 0

    return (
      <div className="space-y-6">
        <WelcomeCard
          userName={data.user.name}
          parcoursTitle={data.parcours.title}
        />

        {/* Stats row */}
        <div id="stats" className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                  <Target className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{percent}%</p>
                  <p className="text-xs text-muted-foreground">Progression</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 shrink-0">
                  <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{data.progress.completed}/{data.progress.total}</p>
                  <p className="text-xs text-muted-foreground">Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 shrink-0">
                  <Award className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.quizzesTaken}</p>
                  <p className="text-xs text-muted-foreground">Quiz passés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                  <Trophy className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgScore > 0 ? `${stats.avgScore}%` : '-'}</p>
                  <p className="text-xs text-muted-foreground">Score moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* XP Card */}
        <XPCard />

        {/* Continue button */}
        {data.nextModule && (
          <Card data-tour="resume" className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/30 dark:border-blue-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {data.progress.completed === 0 ? 'Commencer votre formation' : 'Reprendre votre formation'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      Module suivant : {data.nextModule.title}
                    </p>
                  </div>
                </div>
                <Button asChild className="shrink-0">
                  <Link href={`/learner/modules/${data.nextModule.id}`}>
                    {data.progress.completed === 0 ? 'Commencer' : 'Continuer'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion celebration */}
        {isParcoursCompleted && (
          <Card id="certificates" data-tour="certificates" className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
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

        {/* Badges */}
        <BadgesSection
          stats={{
            completedModules: data.progress.completed,
            quizzesTaken: stats.quizzesTaken,
            avgScore: stats.avgScore,
            completedParcours: isParcoursCompleted ? 1 : 0,
            totalParcours: 1,
          }}
          earnedBadges={earnedBadges.map((b) => ({ badgeType: b.badgeType, earnedAt: b.earnedAt.toISOString() }))}
        />

        <ModuleList modules={data.modules} />
      </div>
    )
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-6">
          <BookOpen className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Bienvenue{session.user.name ? `, ${session.user.name}` : ''} !
        </h1>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Votre compte est bien actif. Un formateur va bientôt vous assigner
          une ou plusieurs formations.
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Vous recevrez un email de notification dès qu&apos;une formation vous sera attribuée.
        </p>
      </div>
    )
  }
}
