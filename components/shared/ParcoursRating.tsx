'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParcoursRatingProps {
  average: number
  count: number
  compact?: boolean
}

export function ParcoursRating({ average, count, compact }: ParcoursRatingProps) {
  if (count === 0) return null

  if (compact) {
    return (
      <div className="flex items-center gap-1" title={`${average}/5 (${count} avis)`}>
        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        <span className="text-xs font-medium">{average}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5" title={`${count} avis`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3 w-3',
              average >= star
                ? 'text-yellow-400 fill-yellow-400'
                : average >= star - 0.5
                  ? 'text-yellow-400 fill-yellow-400/50'
                  : 'text-muted-foreground/20'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  )
}
