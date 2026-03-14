'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuizQuestion } from './QuizQuestion'
import { QuizResult } from './QuizResult'
import { Loader2, HelpCircle } from 'lucide-react'

interface Answer {
  id: string
  text: string
  order: number
}

interface Question {
  id: string
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  order: number
  answers: Answer[]
}

interface Quiz {
  id: string
  moduleId: string
  questions: Question[]
}

interface QuizResultData {
  score: number
  totalQuestions: number
  correctAnswers: number
  results: {
    questionId: string
    correct: boolean
    selectedAnswers: string[]
    correctAnswers: string[]
  }[]
}

interface QuizComponentProps {
  quiz: Quiz
  moduleId: string
  previousResult?: { score: number; totalQuestions: number } | null
  onQuizCompleted?: (result: QuizResultData) => void
}

export function QuizComponent({
  quiz,
  moduleId,
  previousResult,
  onQuizCompleted,
}: QuizComponentProps) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResultData | null>(null)
  const [showQuiz, setShowQuiz] = useState(!previousResult)

  const handleAnswerChange = (questionId: string, answerIds: string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIds,
    }))
  }

  const isAllQuestionsAnswered = () => {
    return quiz.questions.every(
      (q) => answers[q.id] && answers[q.id].length > 0
    )
  }

  const handleSubmit = async () => {
    if (!isAllQuestionsAnswered()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          completeModule: true,
          moduleId,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission du quiz')
      }

      const data = await response.json()
      setResult(data.result)
      onQuizCompleted?.(data.result)
    } catch (error) {
      console.error('Error submitting quiz:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If user already completed the quiz, show previous result
  if (previousResult && !showQuiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz complété
          </CardTitle>
          <CardDescription>
            Vous avez déjà complété ce quiz avec un score de{' '}
            <span className="font-medium">{previousResult.score}%</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setShowQuiz(true)}>
            Revoir les questions
          </Button>
        </CardContent>
      </Card>
    )
  }

  // If result is available, show the result
  if (result) {
    return (
      <div className="space-y-6">
        <QuizResult
          score={result.score}
          totalQuestions={result.totalQuestions}
          correctAnswers={result.correctAnswers}
        />

        {/* Show questions with correct answers */}
        <Card>
          <CardHeader>
            <CardTitle>Correction</CardTitle>
            <CardDescription>
              Voici le détail de vos réponses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((question, index) => {
              const questionResult = result.results.find(
                (r) => r.questionId === question.id
              )
              return (
                <QuizQuestion
                  key={question.id}
                  questionId={question.id}
                  questionNumber={index + 1}
                  text={question.text}
                  type={question.type}
                  answers={question.answers}
                  selectedAnswers={questionResult?.selectedAnswers || []}
                  onAnswerChange={() => {}}
                  showResult
                  correctAnswers={questionResult?.correctAnswers}
                />
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Quiz - Testez vos connaissances
        </CardTitle>
        <CardDescription>
          Complétez ce quiz pour valider le module.
          {quiz.questions.length} question{quiz.questions.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {quiz.questions.map((question, index) => (
          <QuizQuestion
            key={question.id}
            questionId={question.id}
            questionNumber={index + 1}
            text={question.text}
            type={question.type}
            answers={question.answers}
            selectedAnswers={answers[question.id] || []}
            onAnswerChange={handleAnswerChange}
          />
        ))}

        <div className="pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={!isAllQuestionsAnswered() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Soumission...
              </>
            ) : (
              'Soumettre mes réponses'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
