'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminLearnersTable } from './AdminLearnersTable'
import { AddUserDialog } from '@/components/shared/AddUserDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { LearnerItem } from '@/components/shared/LearnersListView'

interface LearnerParcours {
  id: string
  title: string
  completed: number
  total: number
  percentage: number
}

interface ApiLearner {
  id: string
  name: string
  email: string
  trainer: {
    id: string
    name: string
    email: string
  } | null
  parcours: LearnerParcours[]
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

function mapToLearnerItem(learner: ApiLearner): LearnerItem & { progress: ApiLearner['progress']; createdAt: Date } {
  return {
    ...learner,
    progressSummary: {
      total: learner.progress.total,
      completed: learner.progress.completed,
    },
  }
}

export function LearnersPageClient() {
  const [rawLearners, setRawLearners] = useState<ApiLearner[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

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
        setRawLearners(await response.json())
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

        if (learnersRes.ok) setRawLearners(await learnersRes.json())
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

  // Map + client-side search filter
  const learners = useMemo(() => {
    const mapped = rawLearners.map(mapToLearnerItem)
    if (!search) return mapped
    const q = search.toLowerCase()
    return mapped.filter(
      (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    )
  }, [rawLearners, search])

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/learners/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setRawLearners((prev) => prev.filter((l) => l.id !== id))
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
    setRawLearners((prev) =>
      prev.map((l) =>
        l.id === learnerId
          ? { ...l, trainer: updatedLearner.trainer }
          : l
      )
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-36 mb-1" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-9 w-48" />
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-[160px]" />
                <Skeleton className="h-8 w-[160px]" />
                <Skeleton className="h-8 w-[130px]" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
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

      <AdminLearnersTable
        learners={learners}
        trainers={trainers}
        parcoursList={parcoursList}
        search={search}
        onSearchChange={setSearch}
        isLoading={false}
        onDelete={handleDelete}
        onReassign={handleReassign}
        onRefresh={fetchLearners}
        headerExtra={
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
        }
      />
    </div>
  )
}
