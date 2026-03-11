'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrainersTable } from './TrainersTable'
import { AddTrainerForm } from './AddTrainerForm'
import { Plus, GraduationCap } from 'lucide-react'

interface Trainer {
  id: string
  name: string
  email: string
  learnerCount: number
  createdAt: Date
}

export function TrainersPageClient() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    fetchTrainers()
  }, [])

  async function fetchTrainers() {
    try {
      const response = await fetch('/api/admin/trainers')
      if (response.ok) {
        setTrainers(await response.json())
      }
    } catch (error) {
      console.error('Error fetching trainers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRemove(id: string) {
    const response = await fetch(`/api/admin/trainers/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setTrainers((prev) => prev.filter((t) => t.id !== id))
    }
  }

  async function handleAdd(data: { email: string; name?: string }) {
    const response = await fetch('/api/admin/trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Une erreur est survenue')
    }

    const trainer = await response.json()
    setTrainers((prev) => [...prev, { ...trainer, learnerCount: 0 }])
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
          <h1 className="text-2xl font-bold tracking-tight">Formateurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {trainers.length} formateur{trainers.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un formateur
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>
            Liste des utilisateurs avec le rôle formateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainersTable trainers={trainers} onRemove={handleRemove} />
        </CardContent>
      </Card>

      <AddTrainerForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAdd}
      />
    </div>
  )
}
