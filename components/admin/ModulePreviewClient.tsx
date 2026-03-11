'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, BookOpen, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleContent } from '@/components/learner/ModuleContent'
import Link from 'next/link'

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

interface ModulePreviewClientProps {
  moduleId: string
}

export function ModulePreviewClient({ moduleId }: ModulePreviewClientProps) {
  const [module, setModule] = useState<Module | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchModule() {
      try {
        const response = await fetch(`/api/admin/modules/${moduleId}`)
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
          <Link href="/admin/modules">
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
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/modules/${module.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Prévisualisation du module
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{module.parcours.title}</Badge>
          <span className="text-muted-foreground">
            Module {module.order + 1}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{module.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ModuleContent content={module.content} />
        </CardContent>
      </Card>
    </div>
  )
}
