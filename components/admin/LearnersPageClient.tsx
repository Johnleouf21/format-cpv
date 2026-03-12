'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminLearnersTable } from './AdminLearnersTable'
import { AddUserDialog } from '@/components/shared/AddUserDialog'
import { Users, Filter } from 'lucide-react'

interface Learner {
  id: string
  name: string
  email: string
  trainer: {
    id: string
    name: string
    email: string
  } | null
  parcours: {
    id: string
    title: string
  } | null
  progress: {
    completed: number
    total: number
    percentage: number
  }
  createdAt: Date
}

interface Trainer {
  id: string
  name: string
  email: string
}

interface Parcours {
  id: string
  title: string
}

export function LearnersPageClient() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all')
  const [selectedParcours, setSelectedParcours] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const fetchLearners = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedTrainer !== 'all') params.set('trainerId', selectedTrainer)
      if (selectedParcours !== 'all') params.set('parcoursId', selectedParcours)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)

      const response = await fetch(`/api/admin/learners?${params}`)
      if (response.ok) {
        setLearners(await response.json())
      }
    } catch (error) {
      console.error('Error fetching learners:', error)
    }
  }, [selectedTrainer, selectedParcours, selectedStatus])

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [learnersRes, trainersRes, parcoursRes] = await Promise.all([
          fetch('/api/admin/learners'),
          fetch('/api/admin/trainers'),
          fetch('/api/admin/parcours'),
        ])

        if (learnersRes.ok) setLearners(await learnersRes.json())
        if (trainersRes.ok) setTrainers(await trainersRes.json())
        if (parcoursRes.ok) setParcoursList(await parcoursRes.json())
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      fetchLearners()
    }
  }, [selectedTrainer, selectedParcours, selectedStatus, fetchLearners, isLoading])

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/learners/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setLearners((prev) => prev.filter((l) => l.id !== id))
    }
  }

  async function handleReassign(learnerId: string, trainerId: string) {
    const response = await fetch(`/api/admin/learners/${learnerId}/reassign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainerId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Une erreur est survenue')
    }

    const updatedLearner = await response.json()
    setLearners((prev) =>
      prev.map((l) =>
        l.id === learnerId
          ? { ...l, trainer: updatedLearner.trainer }
          : l
      )
    )
  }

  async function handleAssignParcours(learnerId: string, parcoursId: string | null) {
    const response = await fetch(`/api/admin/learners/${learnerId}/assign-parcours`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcoursId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Une erreur est survenue')
    }

    const updatedLearner = await response.json()
    setLearners((prev) =>
      prev.map((l) =>
        l.id === learnerId
          ? {
              ...l,
              parcours: updatedLearner.parcours,
              progress: { completed: 0, total: 0, percentage: 0 },
            }
          : l
      )
    )
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
          <h1 className="text-2xl font-bold tracking-tight">Apprenants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {learners.length} apprenant{learners.length !== 1 ? 's' : ''} trouvé{learners.length !== 1 ? 's' : ''}
          </p>
        </div>
        <AddUserDialog
          parcoursList={parcoursList}
          onUserAdded={fetchLearners}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <CardDescription>
              Liste de tous les apprenants de la plateforme
            </CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Formateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les formateurs</SelectItem>
                  {trainers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedParcours} onValueChange={setSelectedParcours}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Parcours" />
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
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="not_started">Non commencé</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdminLearnersTable
            learners={learners}
            trainers={trainers}
            parcoursList={parcoursList}
            onDelete={handleDelete}
            onReassign={handleReassign}
            onAssignParcours={handleAssignParcours}
          />
        </CardContent>
      </Card>
    </div>
  )
}
