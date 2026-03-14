'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from './ModuleForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleFormSkeleton } from '@/components/shared/ModuleCard'
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
    return <ModuleFormSkeleton />
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
        <h1 className="text-2xl font-bold tracking-tight">Modifier le module</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
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
