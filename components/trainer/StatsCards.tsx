'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, UserCheck, TrendingUp } from 'lucide-react'

interface StatsCardsProps {
  totalInvited: number
  totalConnected: number
  avgCompletion: number
}

export function StatsCards({
  totalInvited,
  totalConnected,
  avgCompletion,
}: StatsCardsProps) {
  const connectionRate =
    totalInvited > 0 ? Math.round((totalConnected / totalInvited) * 100) : 0

  const cards = [
    {
      title: 'Total invités',
      value: totalInvited,
      subtitle: 'Invitations créées',
      icon: Users,
      iconBg: 'bg-primary/5',
      iconColor: 'text-primary',
      accent: 'border-l-primary',
    },
    {
      title: 'Connectés',
      value: totalConnected,
      subtitle: `${connectionRate}% de taux de connexion`,
      icon: UserCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'border-l-emerald-500',
    },
    {
      title: 'Complétion moyenne',
      value: `${avgCompletion}%`,
      subtitle: 'Progression des apprenants',
      icon: TrendingUp,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      accent: 'border-l-violet-500',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
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
            <p className="text-xs text-muted-foreground mt-3">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
