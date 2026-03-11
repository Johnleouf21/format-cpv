'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Route, BookOpen, Users, Eye } from 'lucide-react'

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
        <div className="h-10 bg-gray-200 rounded animate-pulse w-60" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded animate-pulse" />
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
            <Card key={p.id} className="hover:shadow-md transition-all hover:border-gray-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50">
                    <Route className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                  {p.title}
                </CardTitle>
                {p.description && (
                  <CardDescription className="line-clamp-2">
                    {p.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{p.moduleCount} module{p.moduleCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{p.learnerCount} apprenant{p.learnerCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/trainer/parcours/${p.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les modules
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
