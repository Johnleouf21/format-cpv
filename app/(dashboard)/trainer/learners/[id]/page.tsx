import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getLearnerDetails } from '@/lib/services/trainer.service'
import { UserRole } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { User, BookOpen, CheckCircle, HelpCircle } from 'lucide-react'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'

interface LearnerDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function LearnerDetailsPage({
  params,
}: LearnerDetailsPageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  try {
    const data = await getLearnerDetails(session.user.id, id, session.user.role as UserRole)

    const formatDate = (date: Date | string | null) => {
      if (!date) return '-'
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date))
    }

    return (
      <div className="space-y-6">
        <PageBreadcrumb items={[
          { label: 'Apprenants', href: '/trainer/learners' },
          { label: data.learner.name },
        ]} />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="h-8 w-8" />
              {data.learner.name}
            </h1>
            <p className="text-muted-foreground mt-1">{data.learner.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Inscrit le</p>
            <p className="font-medium">{formatDate(data.learner.createdAt)}</p>
          </div>
        </div>

        {/* Progress overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Progression
            </CardTitle>
            <CardDescription>
              {data.parcours?.title || 'Aucun parcours assigné'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Progress value={data.progress.percentage} className="flex-1" />
                <span className="text-xl font-bold">
                  {data.progress.percentage}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {data.progress.completed} / {data.progress.total} modules complétés
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modules list */}
        <Card>
          <CardHeader>
            <CardTitle>Détail des modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.modules.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun module dans ce parcours
                </p>
              ) : (
                data.modules.map((module) => (
                  <div
                    key={module.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      module.isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          module.isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {module.isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          module.order
                        )}
                      </span>
                      <div>
                        <p className="font-medium">{module.title}</p>
                        {module.completedAt && (
                          <p className="text-xs text-muted-foreground">
                            Complété le {formatDate(module.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {module.quizScore && (
                        <Badge
                          className="bg-blue-100 text-blue-700"
                          variant="secondary"
                        >
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Quiz: {module.quizScore.score}%
                        </Badge>
                      )}
                      {module.isCompleted ? (
                        <Badge className="bg-green-500">Complété</Badge>
                      ) : (
                        <Badge variant="secondary">Non commencé</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch {
    notFound()
  }
}
