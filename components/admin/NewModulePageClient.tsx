'use client'

import { useState, useEffect } from 'react'
import { ModuleForm } from './ModuleForm'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleFormSkeleton } from '@/components/shared/ModuleCard'
import Link from 'next/link'

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>

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
