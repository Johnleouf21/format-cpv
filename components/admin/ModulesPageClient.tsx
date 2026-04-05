'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModuleCard, ModuleCardSkeleton } from '@/components/shared/ModuleCard'
import { ConfirmDialog } from './ConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Module {
  id: string
  title: string
  published?: boolean
  parcoursModules: {
    parcoursId: string
    order: number
    parcours: { id: string; title: string }
  }[]
  hasQuiz: boolean
  updatedAt: Date
}

interface Parcours {
  id: string
  title: string
}

export function ModulesPageClient() {
  const [modules, setModules] = useState<Module[]>([])
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [selectedParcours, setSelectedParcours] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [modulesRes, parcoursRes] = await Promise.all([
          fetch('/api/admin/modules'),
          fetch('/api/admin/parcours'),
        ])

        if (modulesRes.ok) {
          setModules(await modulesRes.json())
        }
        if (parcoursRes.ok) {
          setParcoursList(await parcoursRes.json())
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/modules/${deleteId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setModules((prev) => prev.filter((m) => m.id !== deleteId))
        toast.success('Module supprimé')
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredModules = selectedParcours === 'all'
    ? modules
    : modules.filter((m) => m.parcoursModules.some((pm) => pm.parcoursId === selectedParcours))

  const moduleToDelete = modules.find((m) => m.id === deleteId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <ModuleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {modules.length} module{modules.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedParcours} onValueChange={setSelectedParcours}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par parcours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les parcours</SelectItem>
              {parcoursList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/admin/modules/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau module
            </Link>
          </Button>
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Aucun module trouvé
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((m) => (
            <ModuleCard
              key={m.id}
              id={m.id}
              title={m.title}
              parcoursTitles={m.parcoursModules.map((pm) => pm.parcours.title)}
              published={m.published}
              hasQuiz={m.hasQuiz}
              updatedAt={m.updatedAt}
              previewHref={`/admin/modules/${m.id}/preview`}
              editHref={`/admin/modules/${m.id}/edit`}
              onDelete={() => setDeleteId(m.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer le module"
        description={`Êtes-vous sûr de vouloir supprimer le module "${moduleToDelete?.title}" ? Cette action est irréversible et supprimera également les quiz et la progression associés.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}
