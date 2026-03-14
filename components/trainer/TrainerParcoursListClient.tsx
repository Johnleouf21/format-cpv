'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ParcoursCard, ParcoursCardSkeleton } from '@/components/shared/ParcoursCard'

interface Parcours {
  id: string
  title: string
  description: string
  moduleCount: number
  learnerCount: number
}

export function TrainerParcoursListClient() {
  const [parcours, setParcours] = useState<Parcours[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchParcours() {
      try {
        const response = await fetch('/api/trainers/me/parcours')
        if (response.ok) {
          setParcours(await response.json())
        }
      } catch (error) {
        console.error('Error fetching parcours:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchParcours()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-4 w-72" />
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parcours</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Consultez le contenu des parcours et modules de formation
        </p>
      </div>

      {parcours.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Aucun parcours disponible
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {parcours.map((p) => (
            <ParcoursCard
              key={p.id}
              id={p.id}
              title={p.title}
              description={p.description}
              moduleCount={p.moduleCount}
              learnerCount={p.learnerCount}
              detailHref={`/trainer/parcours/${p.id}`}
              detailLabel="Voir les modules"
            />
          ))}
        </div>
      )}
    </div>
  )
}
