'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Learner {
  id: string
  name: string
  parcours: {
    id: string
    title: string
  } | null
  progress: {
    completed: number
    total: number
    percentage: number
  }
}

interface Parcours {
  id: string
  title: string
}

interface AssignParcoursDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learner?: Learner | null
  parcoursList: Parcours[]
  onAssign: (parcoursId: string | null) => Promise<void>
}

export function AssignParcoursDialog({
  open,
  onOpenChange,
  learner,
  parcoursList,
  onAssign,
}: AssignParcoursDialogProps) {
  const [selectedParcoursId, setSelectedParcoursId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setError(null)
    setIsSubmitting(true)

    try {
      await onAssign(selectedParcoursId === 'none' ? null : selectedParcoursId)
      setSelectedParcoursId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Attribuer un parcours</DialogTitle>
            <DialogDescription>
              Choisissez un parcours pour {learner?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            {learner?.parcours && (
              <div className="text-sm text-muted-foreground">
                Parcours actuel: <strong>{learner.parcours.title}</strong>
              </div>
            )}

            {learner?.parcours && selectedParcoursId && selectedParcoursId !== learner.parcours.id && selectedParcoursId !== 'none' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                Ce parcours sera <strong>ajouté</strong> en plus du parcours actuel.
                La progression existante est conservée.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="parcours">Parcours</Label>
              <Select value={selectedParcoursId} onValueChange={setSelectedParcoursId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un parcours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Aucun parcours</span>
                  </SelectItem>
                  {parcoursList.map((parcours) => (
                    <SelectItem key={parcours.id} value={parcours.id}>
                      {parcours.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedParcoursId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Attribuer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
