'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModuleContent } from './ModuleContent'
import { CompleteModuleButton } from './CompleteModuleButton'
import { QuizComponent } from './QuizComponent'
import { FeedbackModal } from './FeedbackModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'
import { Loader2, PartyPopper } from 'lucide-react'

interface ModuleData {
  module: {
    id: string
    title: string
    content: string
    order: number
    hasQuiz: boolean
    minDuration: number
  }
  isCompleted: boolean
  navigation: {
    previous: { id: string; title: string } | null
    next: { id: string; title: string } | null
  }
}

interface Quiz {
  id: string
  moduleId: string
  questions: {
    id: string
    text: string
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
    order: number
    answers: {
      id: string
      text: string
      order: number
    }[]
  }[]
}

interface PreviousQuizResult {
  score: number
  totalQuestions: number
  results: { questionId: string; selectedAnswers: string[]; correctAnswers: string[] }[]
}

interface QuizData {
  hasQuiz: boolean
  quiz: Quiz | null
  previousResult: PreviousQuizResult | null
}

interface ModulePageClientProps {
  data: ModuleData
  initialQuizReview?: boolean
}

export function ModulePageClient({ data, initialQuizReview }: ModulePageClientProps) {
  const router = useRouter()
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(data.module.hasQuiz)
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)
  const [moduleCompleted, setModuleCompleted] = useState(data.isCompleted)
  const [quizCompleted, setQuizCompleted] = useState(false)
  // Show quiz full-screen (replaces module content after clicking "J'ai terminé" or via ?quiz=review)
  const [showQuizView, setShowQuizView] = useState(initialQuizReview && data.isCompleted)
  const [showFeedback, setShowFeedback] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null | undefined>(undefined)

  // Timer for minimum duration
  const [startedAt] = useState(() => new Date().toISOString())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const minDurationSeconds = (data.module.minDuration || 0) * 60
  const timeRemaining = Math.max(0, minDurationSeconds - elapsedSeconds)
  const isTimeElapsed = timeRemaining <= 0

  // Memoize module content to prevent re-renders from timer
  const moduleContentMemo = useMemo(
    () => <ModuleContent content={data.module.content} />,
    [data.module.content]
  )

  useEffect(() => {
    if (minDurationSeconds <= 0) return
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= minDurationSeconds) {
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [minDurationSeconds])

  useEffect(() => {
    if (data.module.hasQuiz) {
      fetch(`/api/modules/${data.module.id}/quiz`)
        .then((res) => res.json())
        .then((quizResponse) => {
          setQuizData(quizResponse)
          if (quizResponse.previousResult) {
            setQuizCompleted(true)
          } else if (data.isCompleted) {
            // Module déjà complété mais quiz jamais passé → afficher le quiz
            setShowQuizView(true)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingQuiz(false))
    }
  }, [data.module.id, data.module.hasQuiz])

  const handleModuleCompleted = (nextModuleId?: string) => {
    setModuleCompleted(true)

    // If there's a quiz to do, switch to quiz view
    if (data.module.hasQuiz && !quizCompleted) {
      setShowQuizView(true)
      return
    }

    // No quiz — show completion and navigate
    finishAndNavigate(nextModuleId)
  }

  const handleQuizCompleted = () => {
    setQuizCompleted(true)
    finishAndNavigate(data.navigation.next?.id)
  }

  const finishAndNavigate = async (nextModuleId?: string | null) => {
    // Show feedback modal only at the end of a parcours (last module, no next)
    if (!nextModuleId && !data.navigation.next) {
      try {
        const res = await fetch('/api/feedback')
        const { hasGivenFeedback } = await res.json()
        if (!hasGivenFeedback) {
          setPendingNavigation(nextModuleId)
          setShowFeedback(true)
          return
        }
      } catch {
        // If check fails, skip feedback
      }
    }

    proceedToCompletion(nextModuleId)
  }

  const handleFeedbackClose = () => {
    setShowFeedback(false)
    proceedToCompletion(pendingNavigation)
  }

  const proceedToCompletion = (nextModuleId?: string | null) => {
    setShowCompletionMessage(true)
    if (nextModuleId) {
      setTimeout(() => {
        router.push(`/learner/modules/${nextModuleId}`)
      }, 2000)
    }
  }

  // Feedback modal
  if (showFeedback) {
    return <FeedbackModal open={showFeedback} onClose={handleFeedbackClose} />
  }

  // Completion celebration
  if (showCompletionMessage) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader className="text-center">
            <PartyPopper className="mx-auto h-16 w-16 text-green-600 mb-4" />
            <CardTitle className="text-2xl text-green-700">
              Module complété !
            </CardTitle>
            <CardDescription className="text-green-600">
              {data.navigation.next
                ? 'Redirection vers le module suivant...'
                : 'Félicitations, vous avez terminé tous les modules !'}
            </CardDescription>
          </CardHeader>
          {data.navigation.next ? (
            <CardContent className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-green-600" />
            </CardContent>
          ) : (
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/learner">Retour à l&apos;accueil</Link>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  // Quiz view — replaces module content after "J'ai terminé" or for review from quiz-history
  if (showQuizView) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb items={[
          { label: 'Mes formations', href: '/learner' },
          { label: data.module.title },
        ]} />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz — {data.module.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {quizCompleted ? 'Correction de vos réponses' : 'Complétez ce quiz pour finaliser le module'}
          </p>
        </div>

        {isLoadingQuiz ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : quizData?.quiz ? (
          <QuizComponent
            quiz={quizData.quiz}
            moduleId={data.module.id}
            previousResult={quizData.previousResult}
            onQuizCompleted={handleQuizCompleted}
            showCorrectionDirectly={!!initialQuizReview}
          />
        ) : null}
      </div>
    )
  }

  // Module view
  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[
        { label: 'Mes formations', href: '/learner' },
        { label: data.module.title },
      ]} />

      {/* Module header + content */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {data.module.order}
          </span>
          <h1 className="text-2xl font-bold">{data.module.title}</h1>
        </div>

        {moduleContentMemo}
      </div>

      {/* Complete button or completed status */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <CompleteModuleButton
          moduleId={data.module.id}
          isCompleted={moduleCompleted}
          nextModuleId={data.navigation.next?.id}
          onCompleted={handleModuleCompleted}
          isTimeElapsed={isTimeElapsed}
          timeRemaining={timeRemaining}
          startedAt={startedAt}
        />
      </div>

      {/* Quiz correction — shown when revisiting a completed module with quiz */}
      {moduleCompleted && quizCompleted && quizData?.quiz && (
        <QuizComponent
          quiz={quizData.quiz}
          moduleId={data.module.id}
          previousResult={quizData.previousResult}
          onQuizCompleted={handleQuizCompleted}
          showCorrectionDirectly
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        {data.navigation.previous ? (
          <Button variant="outline" asChild>
            <Link href={`/learner/modules/${data.navigation.previous.id}`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </Link>
          </Button>
        ) : (
          <div />
        )}

        {data.navigation.next ? (
          <Button variant="outline" asChild>
            <Link href={`/learner/modules/${data.navigation.next.id}`}>
              Suivant
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/learner">Retour à l&apos;accueil</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
