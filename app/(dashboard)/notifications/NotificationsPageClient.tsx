'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Bell,
  Loader2,
  Trash2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMin / 60)
  const diffD = Math.floor(diffH / 24)

  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  if (diffD === 0) return `Aujourd'hui à ${time}`
  if (diffD === 1) return `Hier à ${time}`
  if (diffD < 7) return `Il y a ${diffD} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function NotificationsPageClient() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ mode: 'all', page: String(page) })
      if (filter !== 'all') params.set('filter', filter)
      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setTotal(data.total)
        setUnreadCount(data.unreadCount)
        setTotalPages(data.totalPages)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const notifyBell = () => window.dispatchEvent(new Event('notifications-updated'))

  async function handleMarkAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    })
    fetchNotifications()
    notifyBell()
    toast.success('Toutes les notifications marquées comme lues')
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setTotal((prev) => prev - 1)
    notifyBell()
    toast.success('Notification supprimée')
  }

  async function handleDeleteAll() {
    toast('Supprimer toutes les notifications ?', {
      action: {
        label: 'Confirmer',
        onClick: async () => {
          await fetch('/api/notifications?id=all', { method: 'DELETE' })
          setNotifications([])
          setTotal(0)
          setUnreadCount(0)
          notifyBell()
          toast.success('Toutes les notifications supprimées')
        },
      },
      cancel: {
        label: 'Annuler',
        onClick: () => {},
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} notification{total !== 1 ? 's' : ''}
            {unreadCount > 0 && ` · ${unreadCount} non lue${unreadCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Tout lire
            </Button>
          )}
          {total > 0 && (
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleDeleteAll}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Tout supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(['all', 'unread', 'read'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilter(f); setPage(1) }}
            className="text-xs"
          >
            {f === 'all' ? 'Toutes' : f === 'unread' ? 'Non lues' : 'Lues'}
            {f === 'unread' && unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">{unreadCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Liste */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">
                {filter === 'unread' ? 'Aucune notification non lue' :
                 filter === 'read' ? 'Aucune notification lue' :
                 'Aucune notification'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group',
                    !notif.read && 'bg-primary/5'
                  )}
                >
                  {/* Dot indicateur */}
                  <div className="pt-1.5 shrink-0">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      notif.read ? 'bg-muted-foreground/20' : 'bg-primary'
                    )} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    {notif.link ? (
                      <Link href={notif.link} className="block">
                        <p className={cn('text-sm', !notif.read && 'font-medium')}>{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      </Link>
                    ) : (
                      <>
                        <p className={cn('text-sm', !notif.read && 'font-medium')}>{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      </>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">{formatDate(notif.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(notif.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
