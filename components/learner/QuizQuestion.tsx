'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface Answer {
  id: string
  text: string
  order: number
}

interface QuizQuestionProps {
  questionId: string
  questionNumber: number
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  answers: Answer[]
  selectedAnswers: string[]
  onAnswerChange: (questionId: string, answerIds: string[]) => void
  showResult?: boolean
  correctAnswers?: string[]
}

export function QuizQuestion({
  questionId,
  questionNumber,
  text,
  type,
  answers,
  selectedAnswers,
  onAnswerChange,
  showResult,
  correctAnswers,
}: QuizQuestionProps) {
  const handleSingleChoiceChange = (answerId: string) => {
    onAnswerChange(questionId, [answerId])
  }

  const handleMultipleChoiceChange = (answerId: string, checked: boolean) => {
    if (checked) {
      onAnswerChange(questionId, [...selectedAnswers, answerId])
    } else {
      onAnswerChange(questionId, selectedAnswers.filter((id) => id !== answerId))
    }
  }

  const getAnswerClass = (answerId: string) => {
    if (!showResult || !correctAnswers) return ''

    const isSelected = selectedAnswers.includes(answerId)
    const isCorrect = correctAnswers.includes(answerId)

    if (isCorrect) {
      return 'bg-green-50 border-green-500 dark:bg-green-950'
    }
    if (isSelected && !isCorrect) {
      return 'bg-red-50 border-red-500 dark:bg-red-950'
    }
    return ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {questionNumber}
        </span>
        <p className="text-base font-medium pt-0.5">{text}</p>
      </div>

      {type === 'SINGLE_CHOICE' ? (
        <RadioGroup
          value={selectedAnswers[0] || ''}
          onValueChange={handleSingleChoiceChange}
          disabled={showResult}
          className="space-y-2 pl-10"
        >
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={cn(
                'flex items-center space-x-3 rounded-lg border p-3 transition-colors',
                getAnswerClass(answer.id)
              )}
            >
              <RadioGroupItem value={answer.id} id={answer.id} />
              <Label htmlFor={answer.id} className="cursor-pointer flex-1">
                {answer.text}
              </Label>
              {showResult && correctAnswers?.includes(answer.id) && (
                <span className="text-green-600 text-sm font-medium">✓ Correct</span>
              )}
            </div>
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2 pl-10">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={cn(
                'flex items-center space-x-3 rounded-lg border p-3 transition-colors',
                getAnswerClass(answer.id)
              )}
            >
              <Checkbox
                id={answer.id}
                checked={selectedAnswers.includes(answer.id)}
                onCheckedChange={(checked) =>
                  handleMultipleChoiceChange(answer.id, checked as boolean)
                }
                disabled={showResult}
              />
              <Label htmlFor={answer.id} className="cursor-pointer flex-1">
                {answer.text}
              </Label>
              {showResult && correctAnswers?.includes(answer.id) && (
                <span className="text-green-600 text-sm font-medium">✓ Correct</span>
              )}
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            (Plusieurs réponses possibles)
          </p>
        </div>
      )}
    </div>
  )
}
