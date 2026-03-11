'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ModuleContent } from './ModuleContent'
import { CompleteModuleButton } from './CompleteModuleButton'
import { QuizComponent } from './QuizComponent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, PartyPopper } from 'lucide-react'

interface ModuleData {
  module: {
    id: string
    title: string
    content: string
    order: number
    hasQuiz: boolean
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

interface QuizData {
  hasQuiz: boolean
  quiz: Quiz | null
  previousResult: { score: number; totalQuestions: number } | null
}

interface ModulePageClientProps {
  data: ModuleData
}

export function ModulePageClient({ data }: ModulePageClientProps) {
  const router = useRouter()
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(data.module.hasQuiz)
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    if (data.module.hasQuiz) {
      fetch(`/api/modules/${data.module.id}/quiz`)
        .then((res) => res.json())
        .then((quizResponse) => {
          setQuizData(quizResponse)
          if (quizResponse.previousResult) {
            setQuizCompleted(true)
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingQuiz(false))
    }
  }, [data.module.id, data.module.hasQuiz])

  const handleModuleCompleted = (nextModuleId?: string) => {
    // If there's a quiz and it's not completed, show the quiz
    if (quizData?.hasQuiz && !quizCompleted) {
      // Module marked as complete, now show quiz
      return
    }

    // Show completion message
    setShowCompletionMessage(true)

    // If there's a next module, navigate after delay
    if (nextModuleId) {
      setTimeout(() => {
        router.push(`/learner/modules/${nextModuleId}`)
      }, 2000)
    }
  }

  const handleQuizCompleted = () => {
    setQuizCompleted(true)
    setShowCompletionMessage(true)

    // Navigate to next module after delay
    if (data.navigation.next) {
      setTimeout(() => {
        router.push(`/learner/modules/${data.navigation.next!.id}`)
      }, 2000)
    }
  }

  // Show completion celebration
  if (showCompletionMessage) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-green-500 bg-green-50">
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
          {data.navigation.next && (
            <CardContent className="text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-green-600" />
            </CardContent>
          )}
          {!data.navigation.next && (
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/learner" className="hover:text-foreground">
          Accueil
        </Link>
        <span>/</span>
        <span className="text-foreground">{data.module.title}</span>
      </nav>

      {/* Module header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
            {data.module.order}
          </span>
          <h1 className="text-2xl font-bold">{data.module.title}</h1>
        </div>

        {/* Module content */}
        <ModuleContent content={data.module.content} />
      </div>

      {/* Quiz section */}
      {data.module.hasQuiz && (
        <div className="space-y-4">
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
            />
          ) : null}
        </div>
      )}

      {/* Complete button - show if no quiz or quiz already completed */}
      {(!data.module.hasQuiz || quizCompleted) && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <CompleteModuleButton
            moduleId={data.module.id}
            isCompleted={data.isCompleted}
            nextModuleId={data.navigation.next?.id}
            onCompleted={handleModuleCompleted}
          />
        </div>
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
