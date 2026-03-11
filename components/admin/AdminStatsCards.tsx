'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, GraduationCap, Route, BookOpen } from 'lucide-react'

interface AdminStats {
  totalLearners: number
  totalTrainers: number
  totalParcours: number
  totalModules: number
}

interface AdminStatsCardsProps {
  stats: AdminStats
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      title: 'Apprenants',
      value: stats.totalLearners,
      icon: Users,
      description: 'Utilisateurs en formation',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      accent: 'border-l-blue-500',
    },
    {
      title: 'Formateurs',
      value: stats.totalTrainers,
      icon: GraduationCap,
      description: 'Encadrants actifs',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      accent: 'border-l-violet-500',
    },
    {
      title: 'Parcours',
      value: stats.totalParcours,
      icon: Route,
      description: 'Formations disponibles',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accent: 'border-l-amber-500',
    },
    {
      title: 'Modules',
      value: stats.totalModules,
      icon: BookOpen,
      description: 'Contenus de formation',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-l-emerald-500',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={`border-l-4 ${card.accent} hover:shadow-md transition-shadow`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}