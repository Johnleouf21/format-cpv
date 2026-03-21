'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import { SortableList } from '@/components/shared/SortableList'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'

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

  const handleReorder = (newItems: Answer[]) => {
    setOrderedItems(newItems)
    onAnswerChange(questionId, newItems.map((item) => item.id))
  }

  const getOrderClass = (index: number) => {
    if (!showResult || !correctAnswers) return ''
    const answerId = orderedItems[index]?.id
    const correctIndex = correctAnswers.indexOf(answerId)
    if (correctIndex === index) return 'bg-green-50 border-green-500 dark:bg-green-950'
    return 'bg-red-50 border-red-500 dark:bg-red-950'
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

  const [draggingId, setDraggingId] = useState<string | null>(null)

  const shuffledRight = useState<Answer[]>(() => {
    if (type !== 'MATCHING') return []
    return [...answers].sort(() => Math.random() - 0.5)
  })[0]

  const matchSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleMatchDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id))
  }

  const handleMatchDragEnd = (event: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = event
    if (!over || showResult) return

    const leftId = String(active.id)
    const rightId = String(over.id).replace('drop-', '')

    const newSelections = { ...matchSelections }
    // Libérer si ce rightId est déjà pris
    for (const [key, val] of Object.entries(newSelections)) {
      if (val === rightId) delete newSelections[key]
    }
    newSelections[leftId] = rightId
    setMatchSelections(newSelections)

    const pairs = Object.entries(newSelections).map(([l, r]) => `${l}:${r}`)
    onAnswerChange(questionId, pairs)
  }

  // Also keep click-based matching as fallback (mobile)
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const handleMatchClick = (leftId: string, rightId: string) => {
    if (showResult) return
    const newSelections = { ...matchSelections }
    for (const [key, val] of Object.entries(newSelections)) {
      if (val === rightId) delete newSelections[key]
    }
    newSelections[leftId] = rightId
    setMatchSelections(newSelections)
    setSelectedLeft(null)
    const pairs = Object.entries(newSelections).map(([l, r]) => `${l}:${r}`)
    onAnswerChange(questionId, pairs)
  }

  const getMatchClass = (leftId: string) => {
    if (!showResult || !correctAnswers) return ''
    const selectedRight = matchSelections[leftId]
    if (!selectedRight) return ''
    const correctPair = correctAnswers.find((c) => c.startsWith(`${leftId}:`))
    if (correctPair === `${leftId}:${selectedRight}`) return 'border-green-500 bg-green-50 dark:bg-green-950'
    return 'border-red-500 bg-red-50 dark:bg-red-950'
  }

  const getRightMatchClass = (rightId: string) => {
    if (!showResult || !correctAnswers) return ''
    const leftId = Object.entries(matchSelections).find(([, v]) => v === rightId)?.[0]
    if (!leftId) return ''
    const correctPair = correctAnswers.find((c) => c.startsWith(`${leftId}:`))
    if (correctPair === `${leftId}:${rightId}`) return 'border-green-500 bg-green-50'
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
        <div className="pl-10">
          <SortableList
            items={orderedItems}
            onReorder={handleReorder}
            disabled={showResult}
            renderItem={(item, index) => (
              <div className={cn('flex items-center gap-2 rounded-lg border p-3 transition-colors', getOrderClass(index))}>
                <span className="text-sm font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
                <span className="flex-1 text-sm">{item.text}</span>
                {showResult && correctAnswers && (
                  <span className={cn('text-sm font-medium', correctAnswers[index] === item.id ? 'text-green-600' : 'text-red-600')}>
                    {correctAnswers[index] === item.id ? '✓' : '✗'}
                  </span>
                )}
              </div>
            )}
          />
          {!showResult && (
            <p className="text-sm text-muted-foreground mt-2">Glissez les éléments pour les réordonner</p>
          )}
        </div>
      )}

      {/* MATCHING */}
      {type === 'MATCHING' && (
        <div className="pl-10">
          <DndContext
            sensors={matchSensors}
            onDragStart={handleMatchDragStart}
            onDragEnd={handleMatchDragEnd}
          >
            <div className="grid grid-cols-[1fr_1fr] gap-4">
              {/* Left column — draggable items */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Éléments</p>
                {answers.map((answer) => {
                  const isPaired = !!matchSelections[answer.id]
                  const pairedRight = isPaired
                    ? shuffledRight.find((a) => a.id === matchSelections[answer.id])
                    : null
                  return (
                    <DraggableMatch
                      key={answer.id}
                      id={answer.id}
                      disabled={showResult}
                      className={cn(
                        getMatchClass(answer.id),
                        isPaired && !showResult && 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm flex-1">{answer.text}</span>
                        {isPaired && pairedRight && (
                          <span className="text-[11px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            → {pairedRight.matchText}
                          </span>
                        )}
                      </div>
                    </DraggableMatch>
                  )
                })}
              </div>

              {/* Right column — droppable zones */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-1">Correspondances</p>
                {shuffledRight.map((answer) => {
                  const isUsed = Object.values(matchSelections).includes(answer.id)
                  const pairedLeftId = Object.entries(matchSelections).find(([, v]) => v === answer.id)?.[0]
                  const pairedLeft = pairedLeftId ? answers.find((a) => a.id === pairedLeftId) : null
                  return (
                    <DroppableMatch
                      key={answer.id}
                      id={`drop-${answer.id}`}
                      className={cn(getRightMatchClass(answer.id))}
                      isOver={false}
                    >
                      <div
                        className={cn('text-sm', isUsed && !showResult && 'text-muted-foreground')}
                        onClick={() => {
                          if (selectedLeft && !showResult) {
                            handleMatchClick(selectedLeft, answer.id)
                          }
                        }}
                      >
                        {answer.matchText || answer.text}
                        {pairedLeft && !showResult && (
                          <span className="block text-[11px] text-blue-600 mt-0.5">
                            ← {pairedLeft.text}
                          </span>
                        )}
                      </div>
                    </DroppableMatch>
                  )
                })}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {draggingId && (
                <div className="rounded-lg border-2 border-primary bg-primary/10 p-3 text-sm shadow-lg">
                  {answers.find((a) => a.id === draggingId)?.text}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {!showResult && (
            <p className="text-sm text-muted-foreground mt-3">
              Glissez chaque élément vers sa correspondance, ou cliquez pour associer
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Matching sub-components ────────────────────────────────────────────────

function DraggableMatch({
  id,
  children,
  disabled,
  className,
}: {
  id: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border p-3 transition-all flex items-center gap-2',
        !disabled && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg z-50',
        className
      )}
      {...attributes}
    >
      {!disabled && (
        <button type="button" className="touch-none shrink-0 text-muted-foreground" {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function DroppableMatch({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
  isOver?: boolean
}) {
  const { setNodeRef, isOver: isOverCurrent } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border p-3 transition-all min-h-[48px]',
        isOverCurrent && 'border-primary bg-primary/10 ring-2 ring-primary/30',
        className
      )}
    >
      {children}
    </div>
  )
}
