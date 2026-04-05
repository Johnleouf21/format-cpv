'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Rocket,
  Star,
  Zap,
  Trophy,
  BookOpen,
  Target,
  Award,
  Crown,
  Flame,
  Medal,
} from 'lucide-react'

interface BadgeDefinition {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  check: (stats: BadgeStats) => boolean
}

interface BadgeStats {
  completedModules: number
  quizzesTaken: number
  avgScore: number
  completedParcours: number
  totalParcours: number
}

const BADGES: BadgeDefinition[] = [
  {
    id: 'first-module',
    label: 'Premier pas',
    description: 'Terminer votre premier module',
    icon: Rocket,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    check: (s) => s.completedModules >= 1,
  },
  {
    id: 'five-modules',
    label: 'Studieux',
    description: 'Terminer 5 modules',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    check: (s) => s.completedModules >= 5,
  },
  {
    id: 'ten-modules',
    label: 'Expert',
    description: 'Terminer 10 modules',
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    check: (s) => s.completedModules >= 10,
  },
  {
    id: 'first-quiz',
    label: 'Challenger',
    description: 'Passer votre premier quiz',
    icon: Zap,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    check: (s) => s.quizzesTaken >= 1,
  },
  {
    id: 'quiz-ace',
    label: 'As du quiz',
    description: 'Obtenir 80% ou plus à un quiz',
    icon: Target,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    check: (s) => s.quizzesTaken >= 1 && s.avgScore >= 80,
  },
  {
    id: 'perfect-score',
    label: 'Perfectionniste',
    description: 'Obtenir 100% à un quiz',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    check: (s) => s.quizzesTaken >= 1 && s.avgScore === 100,
  },
  {
    id: 'first-parcours',
    label: 'Diplômé',
    description: 'Terminer votre premier parcours',
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    check: (s) => s.completedParcours >= 1,
  },
  {
    id: 'all-parcours',
    label: 'Champion',
    description: 'Terminer tous vos parcours',
    icon: Trophy,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    check: (s) => s.totalParcours > 0 && s.completedParcours === s.totalParcours,
  },
  {
    id: 'five-quizzes',
    label: 'Persévérant',
    description: 'Passer 5 quiz',
    icon: Flame,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    check: (s) => s.quizzesTaken >= 5,
  },
  {
    id: 'multi-parcours',
    label: 'Polyvalent',
    description: 'Être inscrit à 3+ parcours',
    icon: Medal,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    check: (s) => s.totalParcours >= 3,
  },
]

// Map Prisma BadgeType enum to component badge IDs
const BADGE_TYPE_MAP: Record<string, string> = {
  FIRST_MODULE: 'first-module',
  FIVE_MODULES: 'five-modules',
  TEN_MODULES: 'ten-modules',
  FIRST_QUIZ: 'first-quiz',
  QUIZ_ACE: 'quiz-ace',
  PERFECT_QUIZ: 'perfect-score',
  FIVE_QUIZZES: 'five-quizzes',
  PARCOURS_COMPLETE: 'first-parcours',
  MULTI_PARCOURS: 'multi-parcours',
  CHAMPION: 'all-parcours',
}

interface EarnedBadgeData {
  badgeType: string
  earnedAt: string | Date
}

interface BadgesSectionProps {
  stats: BadgeStats
  earnedBadges?: EarnedBadgeData[]
}

export function BadgesSection({ stats, earnedBadges }: BadgesSectionProps) {
  // Use persisted badges if available, otherwise fall back to stats-based calculation
  const earnedIds = earnedBadges
    ? new Set(earnedBadges.map((b) => BADGE_TYPE_MAP[b.badgeType] || b.badgeType))
    : new Set(BADGES.filter((b) => b.check(stats)).map((b) => b.id))

  const earned = BADGES.filter((b) => earnedIds.has(b.id))
  const locked = BADGES.filter((b) => !earnedIds.has(b.id))

  return (
    <Card data-tour="badges">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Medal className="h-5 w-5 text-amber-500" />
          Badges ({earned.length}/{BADGES.length})
        </CardTitle>
        <CardDescription>Débloquez des badges en progressant dans vos formations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {earned.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center p-3 rounded-lg border bg-background hover:shadow-sm transition-shadow"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${badge.bgColor} mb-2`}>
                  <Icon className={`h-5 w-5 ${badge.color}`} />
                </div>
                <span className="text-xs font-medium">{badge.label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</span>
              </div>
            )
          })}
          {locked.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center text-center p-3 rounded-lg border border-dashed bg-background/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
