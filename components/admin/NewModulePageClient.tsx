'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from './ModuleForm'
import { ModuleFormSkeleton } from '@/components/shared/ModuleCard'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'

interface Parcours {
  id: string
  title: string
}

export function NewModulePageClient() {
  const [parcoursList, setParcoursList] = useState<Parcours[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchParcours() {
      try {
        const response = await fetch('/api/admin/parcours')
        if (response.ok) {
          setParcoursList(await response.json())
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
    return <ModuleFormSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[
        { label: 'Modules', href: '/admin/modules' },
        { label: 'Nouveau module' },
      ]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau module</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Créez un nouveau module de formation
        </p>
      </div>

      <ModuleForm parcoursList={parcoursList} />
    </div>
  )
}
