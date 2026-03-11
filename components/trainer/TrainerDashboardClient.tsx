'use client'

import { useState } from 'react'
import { LearnersTable } from './LearnersTable'

interface Learner {
  id: string
  name: string
  email: string
  parcours: {
    id: string
    title: string
  } | null
  progress: {
    completed: number
    total: number
    percentage: number
  }
  lastActivity: Date | null
  createdAt: Date
}

interface Parcours {
  id: string
  title: string
}

interface TrainerDashboardClientProps {
  initialLearners: Learner[]
  parcoursList: Parcours[]
}

export function TrainerDashboardClient({
  initialLearners,
  parcoursList,
}: TrainerDashboardClientProps) {
  const [learners, setLearners] = useState(initialLearners)
  const [isLoading, setIsLoading] = useState(false)

  const handleFilterChange = async (filters: {
    parcoursId?: string
    status?: string
  }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.parcoursId) params.set('parcoursId', filters.parcoursId)
      if (filters.status) params.set('status', filters.status)

      const response = await fetch(`/api/trainers/me/learners?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLearners(data.learners)
      }
    } catch (error) {
      console.error('Error fetching learners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignParcours = async (learnerId: string, parcoursId: string | null) => {
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

  // Transform dates to strings for the table component
  const transformedLearners = learners.map((l) => ({
    ...l,
    lastActivity: l.lastActivity ? new Date(l.lastActivity).toISOString() : null,
    createdAt: new Date(l.createdAt).toISOString(),
  }))

  return (
    <div className={isLoading ? 'opacity-50' : ''}>
      <LearnersTable
        learners={transformedLearners}
        parcoursList={parcoursList}
        onFilterChange={handleFilterChange}
        onAssignParcours={handleAssignParcours}
      />
    </div>
  )
}
