'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  BookOpen,
  Building2,
  GraduationCap,
  HelpCircle,
  Loader2,
  LogIn,
  Mail,
  Route,
  Trash2,
  UserPlus,
  Users,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityEntry {
  id: string
  action: string
  details: string | null
  targetId: string | null
  targetType: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PARCOURS_CREATED: { icon: Route, color: 'text-green-600 bg-green-100', label: 'Parcours créé' },
  PARCOURS_UPDATED: { icon: Route, color: 'text-blue-600 bg-blue-100', label: 'Parcours modifié' },
  PARCOURS_DELETED: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Parcours supprimé' },
  PARCOURS_ASSIGNED: { icon: GraduationCap, color: 'text-purple-600 bg-purple-100', label: 'Parcours assigné' },
  TRAINER_ADDED: { icon: UserPlus, color: 'text-indigo-600 bg-indigo-100', label: 'Formateur ajouté' },
  TRAINER_REMOVED: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Formateur supprimé' },
  LEARNER_DELETED: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Apprenant supprimé' },
  MODULE_COMPLETED: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100', label: 'Module terminé' },
  MODULE_CREATED: { icon: BookOpen, color: 'text-green-600 bg-green-100', label: 'Module créé' },
  MODULE_UPDATED: { icon: BookOpen, color: 'text-blue-600 bg-blue-100', label: 'Module modifié' },
  MODULE_DELETED: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Module supprimé' },
  QUIZ_UPDATED: { icon: HelpCircle, color: 'text-blue-600 bg-blue-100', label: 'Quiz mis à jour' },
  QUIZ_DELETED: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Quiz supprimé' },
  QUIZ_SUBMITTED: { icon: HelpCircle, color: 'text-teal-600 bg-teal-100', label: 'Quiz soumis' },
  CENTER_CREATED: { icon: Building2, color: 'text-green-600 bg-green-100', label: 'Centre créé' },
  CENTER_UPDATED: { icon: Building2, color: 'text-blue-600 bg-blue-100', label: 'Centre modifié' },
  CENTER_DELETED: { icon: Trash2, color: 'text-red-600 bg-red-100', label: 'Centre supprimé' },
  CENTER_ASSIGNED: { icon: Building2, color: 'text-purple-600 bg-purple-100', label: 'Centre assigné' },
  INVITATIONS_SENT: { icon: Mail, color: 'text-orange-600 bg-orange-100', label: 'Invitations envoyées' },
  USER_LOGIN: { icon: LogIn, color: 'text-sky-600 bg-sky-100', label: 'Connexion' },
}

const DEFAULT_CONFIG = { icon: Activity, color: 'text-gray-600 bg-gray-100', label: 'Action' }

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH}h`
  if (diffD < 7) return `Il y a ${diffD}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'ADMIN':
      return <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Admin</span>
    case 'TRAINER':
      return <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Formateur</span>
    case 'LEARNER':
      return <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">Apprenant</span>
    default:
      return null
  }
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/admin/activity-log')
        if (res.ok) {
          setActivities(await res.json())
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivities()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;activité</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Historique des actions</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;activité</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {activities.length} action{activities.length !== 1 ? 's' : ''} enregistrée{activities.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activités récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune activité enregistrée pour le moment
            </p>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => {
                const config = ACTION_CONFIG[activity.action] || DEFAULT_CONFIG
                const Icon = config.icon

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.color)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {activity.details || config.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activity.user ? (
                          <>
                            <span className="text-xs text-muted-foreground">
                              par {activity.user.name}
                            </span>
                            {getRoleBadge(activity.user.role)}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Système</span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
