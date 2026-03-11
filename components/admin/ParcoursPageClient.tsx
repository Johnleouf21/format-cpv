'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ParcoursTable } from './ParcoursTable'
import { ParcoursForm } from './ParcoursForm'
import { Plus, Route } from 'lucide-react'
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

  useEffect(() => {
    fetchParcours()
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

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/parcours/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setParcoursList((prev) => prev.filter((p) => p.id !== id))
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
          p.id === editingParcours.id
            ? { ...p, ...result }
            : p
        )
      )
    } else {
      setParcoursList((prev) => [...prev, { ...result, moduleCount: 0, learnerCount: 0 }])
    }

    setEditingParcours(null)
  }

  function handleEdit(parcours: Parcours) {
    setEditingParcours(parcours)
    setIsFormOpen(true)
  }

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) {
      setEditingParcours(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
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

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>
            Liste des parcours de formation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParcoursTable
            parcoursList={parcoursList}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </CardContent>
      </Card>

      <ParcoursForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        parcours={editingParcours}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
