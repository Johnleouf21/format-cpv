'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from './ModuleForm'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface Parcours {
  id: string
  title: string
}

interface EditModulePageClientProps {
  moduleId: string
}

export function EditModulePageClient({ moduleId }: EditModulePageClientProps) {
  const [module, setModule] = useState<Module | null>(null)
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [moduleRes, parcoursRes] = await Promise.all([
          fetch(`/api/admin/modules/${moduleId}`),
          fetch('/api/admin/parcours'),
        ])

        if (!moduleRes.ok) {
          throw new Error('Module non trouvé')
        }

        setModule(await moduleRes.json())
        if (parcoursRes.ok) {
          setParcoursList(await parcoursRes.json())
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Modifier le module
        </h1>
        <p className="text-muted-foreground">
          {module.title}
        </p>
      </div>

      <ModuleForm
        module={{
          id: module.id,
          title: module.title,
          content: module.content,
          parcoursId: module.parcours.id,
          order: module.order,
        }}
        parcoursList={parcoursList}
      />
    </div>
  )
}
