'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface ManageParcoursDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
  parcoursList: Parcours[]
  currentParcoursIds: string[]
  onUpdated: () => void
}

export function ManageParcoursDialog({
  open,
  onOpenChange,
  userId,
  userName,
  parcoursList,
  currentParcoursIds,
  onUpdated,
}: ManageParcoursDialogProps) {
  const [selected, setSelected] = useState<string[]>(currentParcoursIds)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelected(currentParcoursIds)
  }, [currentParcoursIds, open])

  const toggleParcours = (parcoursId: string) => {
    setSelected((prev) =>
      prev.includes(parcoursId) ? prev.filter((id) => id !== parcoursId) : [...prev, parcoursId]
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const toAdd = selected.filter((id) => !currentParcoursIds.includes(id))
      const toRemove = currentParcoursIds.filter((id) => !selected.includes(id))

      // Assign new parcours
      for (const parcoursId of toAdd) {
        const res = await fetch(`/api/users/${userId}/parcours`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcoursId, sendNotification: true }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Erreur lors de l\'assignation')
        }
      }

      // Remove parcours
      for (const parcoursId of toRemove) {
        const res = await fetch(`/api/users/${userId}/parcours`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parcoursId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || 'Erreur lors du retrait')
        }
      }

      onUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...currentParcoursIds].sort())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gérer les parcours</DialogTitle>
          <DialogDescription>
            Sélectionnez les parcours assignés à {userName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
          {parcoursList.map((p) => (
            <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1">
              <Checkbox
                checked={selected.includes(p.id)}
                onCheckedChange={() => toggleParcours(p.id)}
              />
              <span className="text-sm">{p.title}</span>
            </label>
          ))}
          {parcoursList.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun parcours disponible</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
