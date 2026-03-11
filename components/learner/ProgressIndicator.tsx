import { TrendingUp, Target } from 'lucide-react'

interface ProgressIndicatorProps {
  completed: number
  total: number
}

export function ProgressIndicator({ completed, total }: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  const isCompleted = percentage === 100

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
            isCompleted ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {isCompleted ? (
              <Target className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingUp className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <p className="text-2xl font-bold">{percentage}%</p>
            <p className="text-sm text-muted-foreground">
              {isCompleted ? 'Parcours terminé !' : 'de progression'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{completed}/{total}</p>
          <p className="text-sm text-muted-foreground">modules complétés</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isCompleted
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Progress dots */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i < completed
                  ? isCompleted ? 'bg-green-200' : 'bg-blue-200'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
