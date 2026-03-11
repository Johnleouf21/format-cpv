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
import { Loader2, AlertTriangle } from 'lucide-react'

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

  // Check if learner has progress that will be reset
  const hasProgress = learner && learner.progress.completed > 0

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

            {hasProgress && selectedParcoursId && selectedParcoursId !== learner?.parcours?.id && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Attention:</strong> Cet apprenant a déjà complété{' '}
                  {learner?.progress.completed} module(s). Changer de parcours
                  réinitialisera sa progression.
                </div>
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
