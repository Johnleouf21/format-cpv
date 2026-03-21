'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown, Link2 } from 'lucide-react'

interface Answer {
  id: string
  text: string
  order: number
  matchText?: string
}

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'ORDERING' | 'MATCHING'

interface QuizQuestionProps {
  questionId: string
  questionNumber: number
  text: string
  type: QuestionType
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
  // ─── Choice handlers ───
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
    if (isCorrect) return 'bg-green-50 border-green-500 dark:bg-green-950'
    if (isSelected && !isCorrect) return 'bg-red-50 border-red-500 dark:bg-red-950'
    return ''
  }

  // ─── Ordering handlers ───
  const [orderedItems, setOrderedItems] = useState<Answer[]>(() => {
    if (type !== 'ORDERING') return []
    // Si déjà répondu (review), utiliser l'ordre des selectedAnswers
    if (selectedAnswers.length > 0) {
      return selectedAnswers
        .map((id) => answers.find((a) => a.id === id))
        .filter(Boolean) as Answer[]
    }
    // Mélanger les réponses
    return [...answers].sort(() => Math.random() - 0.5)
  })

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (showResult) return
    const newItems = [...orderedItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newItems.length) return
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    setOrderedItems(newItems)
    onAnswerChange(questionId, newItems.map((item) => item.id))
  }

  const getOrderClass = (index: number) => {
    if (!showResult || !correctAnswers) return ''
    const answerId = orderedItems[index]?.id
    const correctIndex = correctAnswers.indexOf(answerId)
    if (correctIndex === index) return 'bg-green-50 border-green-500'
    return 'bg-red-50 border-red-500'
  }

  // ─── Matching handlers ───
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>(() => {
    if (type !== 'MATCHING' || selectedAnswers.length === 0) return {}
    // Reconstruct from selectedAnswers format: "leftId:rightId"
    const selections: Record<string, string> = {}
    for (const pair of selectedAnswers) {
      const [left, right] = pair.split(':')
      if (left && right) selections[left] = right
    }
    return selections
  })

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)

  const shuffledRight = useState<Answer[]>(() => {
    if (type !== 'MATCHING') return []
    return [...answers].sort(() => Math.random() - 0.5)
  })[0]

  const handleMatchSelect = (leftId: string, rightId: string) => {
    if (showResult) return
    const newSelections = { ...matchSelections }

    // Si ce rightId est déjà associé à un autre left, le libérer
    for (const [key, val] of Object.entries(newSelections)) {
      if (val === rightId) delete newSelections[key]
    }

    newSelections[leftId] = rightId
    setMatchSelections(newSelections)
    setSelectedLeft(null)

    // Format: ["leftId:rightId", ...]
    const pairs = Object.entries(newSelections).map(([l, r]) => `${l}:${r}`)
    onAnswerChange(questionId, pairs)
  }

  const getMatchClass = (leftId: string) => {
    if (!showResult || !correctAnswers) return ''
    const selectedRight = matchSelections[leftId]
    if (!selectedRight) return ''
    const correctPair = correctAnswers.find((c) => c.startsWith(`${leftId}:`))
    if (correctPair === `${leftId}:${selectedRight}`) return 'border-green-500 bg-green-50'
    return 'border-red-500 bg-red-50'
  }

  // ─── Render ───
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {questionNumber}
        </span>
        <div>
          <p className="text-base font-medium pt-0.5">{text}</p>
          {type === 'ORDERING' && (
            <p className="text-sm text-muted-foreground mt-0.5">Remettez les éléments dans le bon ordre</p>
          )}
          {type === 'MATCHING' && (
            <p className="text-sm text-muted-foreground mt-0.5">Associez chaque élément de gauche à celui de droite</p>
          )}
        </div>
      </div>

      {/* SINGLE CHOICE */}
      {type === 'SINGLE_CHOICE' && (
        <RadioGroup
          value={selectedAnswers[0] || ''}
          onValueChange={handleSingleChoiceChange}
          disabled={showResult}
          className="space-y-2 pl-10"
        >
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={cn('flex items-center space-x-3 rounded-lg border p-3 transition-colors', getAnswerClass(answer.id))}
            >
              <RadioGroupItem value={answer.id} id={answer.id} />
              <Label htmlFor={answer.id} className="cursor-pointer flex-1">{answer.text}</Label>
              {showResult && correctAnswers?.includes(answer.id) && (
                <span className="text-green-600 text-sm font-medium">✓ Correct</span>
              )}
            </div>
          ))}
        </RadioGroup>
      )}

      {/* MULTIPLE CHOICE */}
      {type === 'MULTIPLE_CHOICE' && (
        <div className="space-y-2 pl-10">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className={cn('flex items-center space-x-3 rounded-lg border p-3 transition-colors', getAnswerClass(answer.id))}
            >
              <Checkbox
                id={answer.id}
                checked={selectedAnswers.includes(answer.id)}
                onCheckedChange={(checked) => handleMultipleChoiceChange(answer.id, checked as boolean)}
                disabled={showResult}
              />
              <Label htmlFor={answer.id} className="cursor-pointer flex-1">{answer.text}</Label>
              {showResult && correctAnswers?.includes(answer.id) && (
                <span className="text-green-600 text-sm font-medium">✓ Correct</span>
              )}
            </div>
          ))}
          <p className="text-sm text-muted-foreground">(Plusieurs réponses possibles)</p>
        </div>
      )}

      {/* ORDERING */}
      {type === 'ORDERING' && (
        <div className="space-y-2 pl-10">
          {orderedItems.map((item, index) => (
            <div
              key={item.id}
              className={cn('flex items-center gap-2 rounded-lg border p-3 transition-colors', getOrderClass(index))}
            >
              <span className="text-sm font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
              <span className="flex-1 text-sm">{item.text}</span>
              {!showResult && (
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    aria-label="Monter"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === orderedItems.length - 1}
                    aria-label="Descendre"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {showResult && correctAnswers && (
                <span className={cn('text-sm font-medium', correctAnswers[index] === item.id ? 'text-green-600' : 'text-red-600')}>
                  {correctAnswers[index] === item.id ? '✓' : `✗ (→ ${index + 1})`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MATCHING */}
      {type === 'MATCHING' && (
        <div className="pl-10 space-y-3">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
            {/* Left column */}
            <div className="space-y-2">
              {answers.map((answer) => (
                <div
                  key={answer.id}
                  className={cn(
                    'rounded-lg border p-3 text-sm cursor-pointer transition-all',
                    selectedLeft === answer.id && 'ring-2 ring-primary border-primary',
                    matchSelections[answer.id] && 'bg-blue-50 border-blue-300',
                    getMatchClass(answer.id),
                    showResult && 'cursor-default'
                  )}
                  onClick={() => !showResult && setSelectedLeft(answer.id)}
                >
                  {answer.text}
                  {matchSelections[answer.id] && (
                    <span className="block text-xs text-blue-600 mt-1">
                      → {answers.find((a) => a.id === matchSelections[answer.id])?.matchText ||
                         shuffledRight.find((a) => a.id === matchSelections[answer.id])?.matchText}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Link icon */}
            <div className="flex items-center justify-center pt-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Right column */}
            <div className="space-y-2">
              {shuffledRight.map((answer) => {
                const isUsed = Object.values(matchSelections).includes(answer.id)
                return (
                  <div
                    key={answer.id}
                    className={cn(
                      'rounded-lg border p-3 text-sm transition-all',
                      selectedLeft && !showResult && 'cursor-pointer hover:border-primary hover:bg-primary/5',
                      isUsed && 'opacity-50',
                      showResult && 'cursor-default'
                    )}
                    onClick={() => {
                      if (selectedLeft && !showResult) {
                        handleMatchSelect(selectedLeft, answer.id)
                      }
                    }}
                  >
                    {answer.matchText || answer.text}
                  </div>
                )
              })}
            </div>
          </div>
          {!showResult && (
            <p className="text-sm text-muted-foreground">
              Cliquez sur un élément à gauche, puis sur sa correspondance à droite
            </p>
          )}
        </div>
      )}
    </div>
  )
}
