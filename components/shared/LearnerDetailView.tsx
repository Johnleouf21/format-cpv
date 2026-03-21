'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { User, BookOpen, CheckCircle, HelpCircle, XCircle, CircleDot } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuizAnswer {
  text: string
  isCorrect: boolean
  isSelected: boolean
}

interface QuizQuestion {
  questionText: string
  type: string
  answers: QuizAnswer[]
}

interface ModuleDetail {
  id: string
  title: string
  order: number
  isCompleted: boolean
  completedAt: string | null
  hasQuiz: boolean
  quizScore: { score: number; total: number } | null
  quizDetail: QuizQuestion[] | null
}

interface LearnerDetailData {
  learner: {
    id: string
    name: string
    email: string
    createdAt: string
  }
  parcours: {
    id: string
    title: string
    description: string | null
  } | null
  modules: ModuleDetail[]
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

interface LearnerDetailViewProps {
  data: LearnerDetailData
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function QuizCorrectionView({ questions }: { questions: QuizQuestion[] }) {
  return (
    <div className="space-y-4 mt-3">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-2">
          <p className="font-medium text-sm">
            {i + 1}. {q.questionText}
          </p>
          <div className="space-y-1.5">
            {q.answers.map((a, j) => {
              const isCorrectAndSelected = a.isCorrect && a.isSelected
              const isWrongSelection = a.isSelected && !a.isCorrect
              const isMissedCorrect = a.isCorrect && !a.isSelected

              let bgClass = 'bg-muted/30'
              let textClass = 'text-muted-foreground'
              let Icon = CircleDot

              if (isCorrectAndSelected) {
                bgClass = 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                textClass = 'text-green-700 dark:text-green-300'
                Icon = CheckCircle
              } else if (isWrongSelection) {
                bgClass = 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                textClass = 'text-red-700 dark:text-red-300'
                Icon = XCircle
              } else if (isMissedCorrect) {
                bgClass = 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                textClass = 'text-amber-700 dark:text-amber-300'
                Icon = CheckCircle
              }

              return (
                <div
                  key={j}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${bgClass}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${textClass}`} />
                  <span className={a.isSelected || a.isCorrect ? 'font-medium' : ''}>
                    {a.text}
                  </span>
                  {isWrongSelection && (
                    <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
                      Votre réponse
                    </Badge>
                  )}
                  {isMissedCorrect && (
                    <Badge className="ml-auto bg-amber-500 text-[10px] px-1.5 py-0">
                      Bonne réponse
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LearnerDetailView({ data }: LearnerDetailViewProps) {
  return (
    <div className="space-y-6">
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

      {/* Modules list with quiz detail */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des modules</CardTitle>
        </CardHeader>
        <CardContent>
          {data.modules.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun module dans ce parcours
            </p>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {data.modules.map((module) => {
                const hasQuizDetail = module.quizDetail && module.quizDetail.length > 0

                return (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className={`rounded-lg border px-4 ${
                      module.isCompleted
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-muted'
                    }`}
                  >
                    <AccordionTrigger className="hover:no-underline py-3" disabled={!hasQuizDetail}>
                      <div className="flex items-center justify-between flex-1 mr-4">
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
                          <div className="text-left">
                            <p className="font-medium">{module.title}</p>
                            {module.completedAt && (
                              <p className="text-xs text-muted-foreground">
                                Complété le {formatDate(module.completedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {module.hasQuiz && !module.quizScore && (
                            <Badge variant="outline" className="text-xs">
                              <HelpCircle className="h-3 w-3 mr-1" />
                              Quiz non passé
                            </Badge>
                          )}
                          {module.quizScore && (
                            <Badge
                              className={`${
                                module.quizScore.score >= 80
                                  ? 'bg-green-100 text-green-700'
                                  : module.quizScore.score >= 60
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                              variant="secondary"
                            >
                              <HelpCircle className="h-3 w-3 mr-1" />
                              Quiz : {module.quizScore.score}%
                            </Badge>
                          )}
                          {module.isCompleted ? (
                            <Badge className="bg-green-500">Complété</Badge>
                          ) : (
                            <Badge variant="secondary">Non commencé</Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    {hasQuizDetail && (
                      <AccordionContent>
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Détail du quiz — Score : {module.quizScore?.score}%
                          </p>
                          <QuizCorrectionView questions={module.quizDetail!} />
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                )
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}