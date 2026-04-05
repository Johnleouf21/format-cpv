'use client'

import { useState, useEffect } from 'react'
import { Edit } from 'lucide-react'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ModuleContent } from '@/components/learner/ModuleContent'
import { QuizEditor } from './QuizEditor'
import Link from 'next/link'

interface Module {
  id: string
  title: string
  content: string
  parcoursModules: {
    parcoursId: string
    order: number
    parcours: { id: string; title: string }
  }[]
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
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div>
          <Skeleton className="h-7 w-64 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb items={[
          { label: 'Modules', href: '/admin/modules' },
          { label: 'Erreur' },
        ]} />
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error || 'Module non trouvé'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageBreadcrumb items={[
          { label: 'Modules', href: '/admin/modules' },
          ...(module.parcoursModules.length > 0 ? [{ label: module.parcoursModules[0].parcours.title, href: `/admin/parcours/${module.parcoursModules[0].parcoursId}` }] : []),
          { label: module.title },
        ]} />
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/modules/${module.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prévisualisation du module</h1>
        <div className="flex items-center gap-2 mt-1">
          {module.parcoursModules.length > 0 ? (
            module.parcoursModules.map((pm) => (
              <Badge key={pm.parcoursId} variant="secondary">{pm.parcours.title}</Badge>
            ))
          ) : (
            <Badge variant="outline">Non assigné</Badge>
          )}
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

      <QuizEditor moduleId={module.id} />
    </div>
  )
}
