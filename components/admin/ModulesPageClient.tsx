'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModulesTable } from './ModulesTable'
import { Plus, BookOpen } from 'lucide-react'

interface Module {
  id: string
  title: string
  order: number
  parcours: {
    id: string
    title: string
  }
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

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/modules/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setModules((prev) => prev.filter((m) => m.id !== id))
    }
  }

  const filteredModules = selectedParcours === 'all'
    ? modules
    : modules.filter((m) => m.parcours.id === selectedParcours)

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
          <h1 className="text-2xl font-bold tracking-tight">Modules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {modules.length} module{modules.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/modules/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau module
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardDescription>
              Liste des modules de formation
            </CardDescription>
            <Select value={selectedParcours} onValueChange={setSelectedParcours}>
              <SelectTrigger className="w-full sm:w-[200px]">
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
          </div>
        </CardHeader>
        <CardContent>
          <ModulesTable modules={filteredModules} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  )
}
