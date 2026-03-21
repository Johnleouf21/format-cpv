'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ParcoursCard, ParcoursCardSkeleton } from '@/components/shared/ParcoursCard'
import { ParcoursForm } from './ParcoursForm'
import { ConfirmDialog } from './ConfirmDialog'
import { Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface Parcours {
  id: string
  title: string
  description: string
  moduleCount: number
  learnerCount: number
  createdAt: Date
}

export function ParcoursPageClient() {
  const searchParams = useSearchParams()
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true')
  const [editingParcours, setEditingParcours] = useState<Parcours | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [ratings, setRatings] = useState<Record<string, { average: number; count: number }>>({})

  useEffect(() => {
    fetchParcours()
    fetch('/api/parcours/ratings')
      .then((res) => res.ok ? res.json() : {})
      .then(setRatings)
      .catch(() => {})
  }, [])

  async function fetchParcours() {
    try {
      const response = await fetch('/api/admin/parcours')
      if (response.ok) {
        setParcoursList(await response.json())
      }
    } catch (error) {
      console.error('Error fetching parcours:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/parcours/${deleteId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setParcoursList((prev) => prev.filter((p) => p.id !== deleteId))
        setDeleteId(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSubmit(data: { title: string; description: string }) {
    const isEditing = !!editingParcours
    const url = isEditing
      ? `/api/admin/parcours/${editingParcours.id}`
      : '/api/admin/parcours'
    const method = isEditing ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Une erreur est survenue')
    }

    const result = await response.json()

    if (isEditing) {
      setParcoursList((prev) =>
        prev.map((p) =>
          p.id === editingParcours.id ? { ...p, ...result } : p
        )
      )
    } else {
      setParcoursList((prev) => [...prev, { ...result, moduleCount: 0, learnerCount: 0 }])
    }

    setEditingParcours(null)
  }

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) {
      setEditingParcours(null)
    }
  }

  const parcoursToDelete = parcoursList.find((p) => p.id === deleteId)
  const canDelete = parcoursToDelete?.learnerCount === 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ParcoursCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parcours</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {parcoursList.length} parcours au total
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau parcours
        </Button>
      </div>

      {parcoursList.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Aucun parcours trouvé
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parcoursList.map((p) => (
            <ParcoursCard
              key={p.id}
              id={p.id}
              title={p.title}
              description={p.description}
              moduleCount={p.moduleCount}
              learnerCount={p.learnerCount}
              detailHref={`/admin/parcours/${p.id}`}
              onEdit={() => {
                setEditingParcours(p)
                setIsFormOpen(true)
              }}
              rating={ratings[p.id]}
              onDelete={() => setDeleteId(p.id)}
              canDelete={p.learnerCount === 0}
            />
          ))}
        </div>
      )}

      <ParcoursForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        parcours={editingParcours}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer le parcours"
        description={
          canDelete
            ? `Êtes-vous sûr de vouloir supprimer le parcours "${parcoursToDelete?.title}" ? Cette action supprimera également tous les modules associés.`
            : 'Ce parcours ne peut pas être supprimé car il a des apprenants actifs.'
        }
        confirmLabel="Supprimer"
        onConfirm={canDelete ? handleDelete : () => setDeleteId(null)}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  )
}
