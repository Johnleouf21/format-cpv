'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ParcoursDetailSkeleton } from '@/components/shared/ParcoursCard'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'
import { BookOpen, Plus, Edit, Eye } from 'lucide-react'
import { SortableList } from '@/components/shared/SortableList'

interface Module {
  id: string
  title: string
  order: number
  createdAt: Date
}

interface ParcoursDetail {
  id: string
  title: string
  description: string
  learnerCount: number
  modules: Module[]
}

interface ParcoursDetailClientProps {
  parcoursId: string
}

export function ParcoursDetailClient({ parcoursId }: ParcoursDetailClientProps) {
  const [parcours, setParcours] = useState<ParcoursDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchParcours() {
      try {
        const response = await fetch(`/api/admin/parcours/${parcoursId}`)
        if (!response.ok) {
          throw new Error('Parcours non trouvé')
        }
        setParcours(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchParcours()
  }, [parcoursId])

  const handleReorder = async (newModules: Module[]) => {
    if (!parcours || isReordering) return

    const moduleOrders = newModules.map((m, index) => ({
      id: m.id,
      order: index,
    }))

    // Optimistic update
    const previous = parcours
    setParcours({
      ...parcours,
      modules: newModules.map((m, index) => ({ ...m, order: index })),
    })

    setIsReordering(true)
    try {
      const response = await fetch('/api/admin/modules/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcoursId, moduleOrders }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors du réordonnancement')
      }
    } catch {
      setParcours(previous)
    } finally {
      setIsReordering(false)
    }
  }

  if (isLoading) {
    return <ParcoursDetailSkeleton />
  }

  if (error || !parcours) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb items={[
          { label: 'Parcours', href: '/admin/parcours' },
          { label: 'Erreur' },
        ]} />
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error || 'Parcours non trouvé'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[
        { label: 'Parcours', href: '/admin/parcours' },
        { label: parcours.title },
      ]} />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{parcours.title}</h1>
          {parcours.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {parcours.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {parcours.modules.length} module{parcours.modules.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary">
            {parcours.learnerCount} apprenant{parcours.learnerCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Modules du parcours</CardTitle>
              <CardDescription>
                Modules ordonnés par position
              </CardDescription>
            </div>
            <Button asChild>
              <Link href={`/admin/modules/new?parcoursId=${parcours.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un module
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            {parcours.modules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun module dans ce parcours
              </div>
            ) : (
              <SortableList
                items={parcours.modules}
                onReorder={handleReorder}
                disabled={isReordering}
                renderItem={(module, index) => (
                  <div className="flex items-center gap-3 rounded-lg border p-3 bg-background">
                    <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{module.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(module.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" asChild aria-label="Prévisualiser">
                        <Link href={`/admin/modules/${module.id}/preview`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild aria-label="Modifier">
                        <Link href={`/admin/modules/${module.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              />
            )}
        </CardContent>
      </Card>
    </div>
  )
}
