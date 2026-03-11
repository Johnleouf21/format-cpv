import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Play, Lock, HelpCircle, Award } from 'lucide-react'

interface ModuleCardProps {
  id: string
  title: string
  order: number
  isCompleted: boolean
  isNext: boolean
  isLocked?: boolean
  hasQuiz?: boolean
  quizScore?: { score: number; total: number } | null
}

export function ModuleCard({
  id,
  title,
  order,
  isCompleted,
  isNext,
  isLocked = false,
  hasQuiz,
  quizScore,
}: ModuleCardProps) {
  const cardClassName = cn(
    'flex-1 mb-4 p-4 rounded-xl border transition-all',
    isLocked && 'cursor-not-allowed opacity-60',
    !isLocked && 'cursor-pointer hover:shadow-md',
    isCompleted && 'bg-green-50/50 border-green-200 hover:bg-green-50',
    isNext && !isCompleted && 'bg-primary/5 border-primary/30 hover:bg-primary/10 shadow-sm',
    !isCompleted && !isNext && !isLocked && 'bg-white border-gray-200 hover:border-gray-300',
  )

  const cardContent = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        {/* Module label */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            'text-xs font-medium uppercase tracking-wide',
            isCompleted ? 'text-green-600' : isNext ? 'text-primary' : 'text-gray-400'
          )}>
            Module {order}
          </span>
          {hasQuiz && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                quizScore
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              )}
            >
              <HelpCircle className="w-3 h-3" />
              Quiz
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-semibold text-base leading-tight',
          isCompleted ? 'text-green-800' : isNext ? 'text-foreground' : 'text-gray-700'
        )}>
          {title}
        </h3>

        {/* Status */}
        <div className="mt-2 flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Terminé
            </span>
          ) : isNext ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              <Play className="w-3.5 h-3.5" />
              À suivre
            </span>
          ) : isLocked ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Lock className="w-3.5 h-3.5" />
              Verrouillé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Circle className="w-3.5 h-3.5" />
              Non commencé
            </span>
          )}

          {/* Quiz score if completed */}
          {quizScore && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium ml-2">
              <Award className="w-3.5 h-3.5" />
              {quizScore.score}%
            </span>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      {!isLocked && (
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
          isNext ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-400'
        )}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Icon */}
        <div
          className={cn(
            'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all',
            isCompleted && 'bg-green-500 border-green-500 text-white',
            isNext && !isCompleted && 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30',
            !isCompleted && !isNext && !isLocked && 'bg-white border-gray-200 text-gray-400',
            isLocked && 'bg-gray-100 border-gray-200 text-gray-300',
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : isNext ? (
            <Play className="w-5 h-5 ml-0.5" />
          ) : isLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            <span className="text-lg font-semibold">{order}</span>
          )}
        </div>
        {/* Vertical line */}
        <div className={cn(
          'timeline-line w-0.5 flex-1 min-h-[20px]',
          isCompleted ? 'bg-green-300' : 'bg-gray-200'
        )} />
      </div>

      {/* Card content */}
      {isLocked ? (
        <div className={cardClassName}>{cardContent}</div>
      ) : (
        <Link href={`/learner/modules/${id}`} className={cardClassName}>
          {cardContent}
        </Link>
      )}
    </div>
  )
}
