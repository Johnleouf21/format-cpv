'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface AtRiskLearner {
  id: string
  name: string
  email: string
  percentage: number
  lastActivity: Date | null
}

interface AtRiskLearnersProps {
  learners: AtRiskLearner[]
}

function formatRelativeDate(date: Date | null): string {
  if (!date) return 'Jamais'
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

export function AtRiskLearners({ learners }: AtRiskLearnersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Apprenants à relancer
          {learners.length > 0 && (
            <Badge variant="secondary" className="text-xs">{learners.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {learners.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              Tous vos apprenants sont actifs !
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-52 overflow-y-auto">
            {learners.map((learner) => (
              <Link
                key={learner.id}
                href={`/trainer/learners/${learner.id}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{learner.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Dernière activité : {formatRelativeDate(learner.lastActivity)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Progress value={learner.percentage} className="h-2 w-16" />
                  <span className="text-xs font-medium w-8 text-right">{learner.percentage}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
