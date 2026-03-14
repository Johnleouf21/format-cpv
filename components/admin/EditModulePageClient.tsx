'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from './ModuleForm'
import { ModuleFormSkeleton } from '@/components/shared/ModuleCard'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'

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
      <PageBreadcrumb items={[
        { label: 'Modules', href: '/admin/modules' },
        { label: module.parcours.title, href: `/admin/parcours/${module.parcours.id}` },
        { label: `Modifier : ${module.title}` },
      ]} />

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
