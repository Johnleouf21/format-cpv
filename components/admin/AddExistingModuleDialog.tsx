'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AvailableModule {
  id: string
  title: string
  parcours: string[]
}

interface AddExistingModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parcoursId: string
  excludeModuleIds: string[]
  onAdded: () => void
}

export function AddExistingModuleDialog({
  open,
  onOpenChange,
  parcoursId,
  excludeModuleIds,
  onAdded,
}: AddExistingModuleDialogProps) {
  const [modules, setModules] = useState<AvailableModule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function fetchModules() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/admin/modules?all=true')
        if (res.ok) {
          const data = await res.json()
          setModules(data.filter((m: AvailableModule) => !excludeModuleIds.includes(m.id)))
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }

    fetchModules()
  }, [open, excludeModuleIds])

  const filtered = modules.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd(moduleId: string) {
    setAddingId(moduleId)
    try {
      const res = await fetch(`/api/admin/parcours/${parcoursId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      })

      if (res.ok) {
        toast.success('Module ajouté au parcours')
        setModules((prev) => prev.filter((m) => m.id !== moduleId))
        onAdded()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de l\'ajout')
      }
    } catch {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Ajouter un module existant
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un module déjà créé pour l&apos;ajouter à ce parcours.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {modules.length === 0
                ? 'Tous les modules sont déjà dans ce parcours'
                : 'Aucun module trouvé'}
            </p>
          ) : (
            filtered.map((module) => (
              <div
                key={module.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{module.title}</p>
                  {module.parcours.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {module.parcours.map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdd(module.id)}
                  disabled={addingId === module.id}
                >
                  {addingId === module.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Ajouter
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
