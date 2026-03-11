'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizResultProps {
  score: number
  totalQuestions: number
  correctAnswers: number
}

export function QuizResult({ score, totalQuestions, correctAnswers }: QuizResultProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = () => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getMessage = () => {
    if (score >= 80) return 'Excellent travail ! Vous maîtrisez bien ce module.'
    if (score >= 60) return 'Bon travail ! Vous avez compris les concepts essentiels.'
    return 'Continuez vos efforts ! Vous pouvez revoir le contenu du module.'
  }

  return (
    <Card className="border-2">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2">
          {score >= 60 ? (
            <Trophy className="h-12 w-12 text-yellow-500" />
          ) : (
            <CheckCircle className="h-12 w-12 text-blue-500" />
          )}
        </div>
        <CardTitle className="text-xl">Résultat du Quiz</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <span className={cn('text-5xl font-bold', getScoreColor())}>
            {score}%
          </span>
          <p className="text-muted-foreground mt-2">
            {correctAnswers} / {totalQuestions} réponses correctes
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Score</span>
            <span>{score}%</span>
          </div>
          <Progress value={score} className={cn('[&>div]:transition-all', `[&>div]:${getProgressColor()}`)} />
        </div>

        <p className="text-center text-muted-foreground">{getMessage()}</p>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">{correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Correctes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium">{totalQuestions - correctAnswers}</p>
              <p className="text-xs text-muted-foreground">Incorrectes</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
