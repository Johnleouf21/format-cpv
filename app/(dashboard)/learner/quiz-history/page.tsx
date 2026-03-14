import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FileQuestion, Calendar, BookOpen, CheckCircle, XCircle } from 'lucide-react'

export default async function QuizHistoryPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const quizResults = await prisma.quizResult.findMany({
    where: {
      progress: { userId: session.user.id },
    },
    include: {
      progress: {
        include: {
          module: {
            select: {
              id: true,
              title: true,
              parcours: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((sum, q) => sum + (q.score / q.totalQuestions) * 100, 0) / quizResults.length)
    : 0

  const passedCount = quizResults.filter((q) => (q.score / q.totalQuestions) >= 0.6).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique des quiz</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {quizResults.length > 0
            ? `${quizResults.length} quiz passé${quizResults.length !== 1 ? 's' : ''} — Score moyen : ${avgScore}%`
            : 'Vous n\'avez pas encore passé de quiz'}
        </p>
      </div>

      {/* Summary stats */}
      {quizResults.length > 0 && (
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{quizResults.length}</p>
              <p className="text-xs text-muted-foreground">Quiz passés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Score moyen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{passedCount}/{quizResults.length}</p>
              <p className="text-xs text-muted-foreground">Réussis (≥60%)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {quizResults.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 mb-4">
                <FileQuestion className="h-7 w-7 text-violet-600" />
              </div>
              <p className="text-muted-foreground max-w-sm">
                Les quiz apparaîtront ici au fur et à mesure que vous les passerez dans vos formations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizResults.map((result) => {
            const scorePercent = Math.round((result.score / result.totalQuestions) * 100)
            const passed = scorePercent >= 60

            return (
              <Card key={result.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                      {passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{result.progress.module.title}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {result.progress.module.parcours.title}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {result.completedAt.toLocaleDateString('fr-FR')}
                        </span>
                        <span>{result.score}/{result.totalQuestions} bonnes réponses</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Progress value={scorePercent} className={`h-2 w-20 ${passed ? '' : '[&>[data-slot=progress-indicator]]:bg-red-500'}`} />
                      <Badge variant={passed ? 'default' : 'destructive'} className={passed ? 'bg-green-600' : ''}>
                        {scorePercent}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
