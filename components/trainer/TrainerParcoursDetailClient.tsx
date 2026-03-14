'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Route, BookOpen, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ParcoursDetailSkeleton } from '@/components/shared/ParcoursCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Module {
  id: string
  title: string
  order: number
  createdAt: string
}

interface Parcours {
  id: string
  title: string
  description: string
  modules: Module[]
  learnerCount: number
}

interface TrainerParcoursDetailClientProps {
  parcoursId: string
}

export function TrainerParcoursDetailClient({ parcoursId }: TrainerParcoursDetailClientProps) {
  const [parcours, setParcours] = useState<Parcours | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchParcours() {
      try {
        const response = await fetch(`/api/trainers/me/parcours/${parcoursId}`)
        if (!response.ok) {
          throw new Error('Parcours non trouvé')
        }
        setParcours(await response.json())
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchParcours()
  }, [parcoursId])

  if (isLoading) {
    return <ParcoursDetailSkeleton />
  }

  if (error || !parcours) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trainer/parcours">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error || 'Parcours non trouvé'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/trainer/parcours">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux parcours
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{parcours.title}</h1>
        {parcours.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{parcours.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50">
              <BookOpen className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            Modules ({parcours.modules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parcours.modules.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun module dans ce parcours
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ordre</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcours.modules.map((module) => (
                  <TableRow key={module.id}>
                    <TableCell className="font-medium">
                      {module.order + 1}
                    </TableCell>
                    <TableCell>{module.title}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/trainer/parcours/${parcoursId}/modules/${module.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
