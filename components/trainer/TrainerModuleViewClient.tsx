'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleContent } from '@/components/learner/ModuleContent'

interface Module {
  id: string
  title: string
  content: string
  order: number
  parcours: {
    id: string
    title: string
  }
}

interface TrainerModuleViewClientProps {
  parcoursId: string
  moduleId: string
}

export function TrainerModuleViewClient({ parcoursId, moduleId }: TrainerModuleViewClientProps) {
  const [module, setModule] = useState<Module | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchModule() {
      try {
        const response = await fetch(`/api/trainers/me/modules/${moduleId}`)
        if (!response.ok) {
          throw new Error('Module non trouvé')
        }
        setModule(await response.json())
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchModule()
  }, [moduleId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-40" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/trainer/parcours/${parcoursId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error || 'Module non trouvé'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/trainer/parcours/${parcoursId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux modules
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{module.title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary">{module.parcours.title}</Badge>
          <span className="text-sm text-muted-foreground">
            Module {module.order + 1}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
              <BookOpen className="h-4.5 w-4.5 text-blue-600" />
            </div>
            Contenu du module
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ModuleContent content={module.content} />
        </CardContent>
      </Card>
    </div>
  )
}
