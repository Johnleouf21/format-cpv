'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface ProgressDistributionProps {
  distribution: {
    notStarted: number
    inProgress: number
    almostDone: number
    completed: number
  }
  total: number
}

export function ProgressDistribution({ distribution, total }: ProgressDistributionProps) {
  const segments = [
    { label: 'Non commencé', value: distribution.notStarted, color: 'bg-gray-300' },
    { label: 'En cours (1-49%)', value: distribution.inProgress, color: 'bg-blue-400' },
    { label: 'Bientôt fini (50-99%)', value: distribution.almostDone, color: 'bg-amber-400' },
    { label: 'Terminé', value: distribution.completed, color: 'bg-green-500' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-600" />
          Répartition de la progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="flex h-4 rounded-full overflow-hidden bg-muted">
          {segments.map((seg) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={seg.label}
                className={`${seg.color} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${seg.label}: ${seg.value}`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${seg.color} shrink-0`} />
              <span className="text-xs text-muted-foreground">{seg.label}</span>
              <span className="text-xs font-medium ml-auto">{seg.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
