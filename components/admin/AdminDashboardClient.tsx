'use client'

import { useState, useEffect } from 'react'
import { AdminStatsCards } from './AdminStatsCards'
import { AddTrainerForm } from './AddTrainerForm'
import { AddUserDialog } from '@/components/shared/AddUserDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Route, GraduationCap, Users, Plus, ArrowRight, UserPlus } from 'lucide-react'

interface AdminStats {
  totalLearners: number
  totalTrainers: number
  totalParcours: number
  totalModules: number
}

interface Parcours {
  id: string
  title: string
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [isTrainerFormOpen, setIsTrainerFormOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, parcoursRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/parcours'),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (parcoursRes.ok) setParcoursList(await parcoursRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function handleAddTrainer(data: { email: string; name?: string }) {
    const response = await fetch('/api/admin/trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Une erreur est survenue')
    }
    // Refresh stats
    const statsRes = await fetch('/api/admin/stats')
    if (statsRes.ok) setStats(await statsRes.json())
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-3 w-16 mb-2" />
                    <Skeleton className="h-7 w-10" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Modules',
      description: 'Créez et modifiez les modules de formation',
      icon: BookOpen,
      href: '/admin/modules',
      newHref: '/admin/modules/new',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Parcours',
      description: 'Organisez les parcours de formation',
      icon: Route,
      href: '/admin/parcours',
      newHref: '/admin/parcours?new=true',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Formateurs',
      description: 'Gérez les comptes formateurs',
      icon: GraduationCap,
      href: '/admin/trainers',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      action: () => setIsTrainerFormOpen(true),
    },
    {
      title: 'Apprenants',
      description: 'Suivez et gérez les apprenants',
      icon: Users,
      href: '/admin/learners',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
  ]

  const refreshStats = async () => {
    const statsRes = await fetch('/api/admin/stats')
    if (statsRes.ok) setStats(await statsRes.json())
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1">
          Gérez le contenu et les utilisateurs de la plateforme
        </p>
      </div>

      {stats && <AdminStatsCards stats={stats} />}

      <div>
        <h2 className="text-lg font-semibold mb-4">Accès rapides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Card key={action.title} className="group hover:shadow-md transition-all hover:border-gray-300">
              <CardHeader className="pb-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${action.iconBg}`}>
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <CardTitle className="text-base mt-3">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={action.href}>
                    Voir
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                {action.newHref && (
                  <Button size="sm" asChild>
                    <Link href={action.newHref}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Nouveau
                    </Link>
                  </Button>
                )}
                {action.action && (
                  <Button size="sm" onClick={action.action}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                )}
                {action.title === 'Apprenants' && (
                  <AddUserDialog
                    parcoursList={parcoursList}
                    onUserAdded={refreshStats}
                    trigger={
                      <Button size="sm">
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Ajouter
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AddTrainerForm
        open={isTrainerFormOpen}
        onOpenChange={setIsTrainerFormOpen}
        onSubmit={handleAddTrainer}
      />
    </div>
  )
}
