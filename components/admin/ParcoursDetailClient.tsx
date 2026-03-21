'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ParcoursDetailSkeleton } from '@/components/shared/ParcoursCard'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'
import { BookOpen, Plus, Edit, Eye, ChevronUp, ChevronDown } from 'lucide-react'

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

  const handleReorder = async (moduleId: string, direction: 'up' | 'down') => {
    if (!parcours || isReordering) return

    const modules = [...parcours.modules]
    const currentIndex = modules.findIndex(m => m.id === moduleId)

    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === modules.length - 1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Swap modules
    const temp = modules[currentIndex]
    modules[currentIndex] = modules[targetIndex]
    modules[targetIndex] = temp

    // Update orders
    const moduleOrders = modules.map((m, index) => ({
      id: m.id,
      order: index,
    }))

    // Optimistic update
    setParcours({
      ...parcours,
      modules: modules.map((m, index) => ({ ...m, order: index })),
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
      // Revert on error
      setParcours(parcours)
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ordre</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcours.modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucun module dans ce parcours
                  </TableCell>
                </TableRow>
              ) : (
                parcours.modules.map((module, index) => (
                  <TableRow key={module.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorder(module.id, 'up')}
                            disabled={index === 0 || isReordering}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReorder(module.id, 'down')}
                            disabled={index === parcours.modules.length - 1 || isReordering}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="outline">{module.order + 1}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{module.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(module.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild title="Prévisualiser">
                          <Link href={`/admin/modules/${module.id}/preview`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Modifier">
                          <Link href={`/admin/modules/${module.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
