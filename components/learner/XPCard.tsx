'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Zap, Star } from 'lucide-react'

interface XPData {
  total: number
  modules: number
  quizzes: number
  badges: number
  parcours: number
  level: number
  levelProgress: number
}

export function XPCard() {
  const [xp, setXP] = useState<XPData | null>(null)

  useEffect(() => {
    fetch('/api/learner/xp')
      .then((res) => res.ok ? res.json() : null)
      .then(setXP)
      .catch(() => null)
  }, [])

  if (!xp) return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50 dark:border-indigo-800">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full mt-4" />
        <div className="grid grid-cols-4 gap-1 mt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-6 mx-auto mb-1" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50 dark:border-indigo-800">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Zap className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{xp.total} XP</p>
              <p className="text-[10px] text-muted-foreground">Points d&apos;expérience</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
            <Star className="h-3.5 w-3.5 fill-indigo-500" />
            <span className="text-xs font-bold">Niv. {xp.level}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Niveau {xp.level}</span>
            <span>Niveau {xp.level + 1}</span>
          </div>
          <Progress value={xp.levelProgress} className="h-2" />
        </div>
        <div className="grid grid-cols-4 gap-1 mt-3">
          {[
            { label: 'Modules', value: xp.modules },
            { label: 'Quiz', value: xp.quizzes },
            { label: 'Badges', value: xp.badges },
            { label: 'Parcours', value: xp.parcours },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-xs font-semibold">{item.value}</p>
              <p className="text-[9px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
