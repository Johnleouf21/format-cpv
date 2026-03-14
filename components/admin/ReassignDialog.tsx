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
  trainer?: {
    id: string
    name: string
    email?: string
  } | null
}

interface Trainer {
  id: string
  name: string
  email: string
}

interface ReassignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learner?: Learner | null
  trainers: Trainer[]
  onReassign: (trainerId: string) => Promise<void>
}

export function ReassignDialog({
  open,
  onOpenChange,
  learner,
  trainers,
  onReassign,
}: ReassignDialogProps) {
  const [selectedTrainerId, setSelectedTrainerId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter out current trainer
  const availableTrainers = trainers.filter(
    (t) => t.id !== learner?.trainer?.id
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTrainerId) return

    setError(null)
    setIsSubmitting(true)

    try {
      await onReassign(selectedTrainerId)
      setSelectedTrainerId('')
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
            <DialogTitle>Réattribuer l'apprenant</DialogTitle>
            <DialogDescription>
              Choisissez un nouveau formateur pour {learner?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            {learner?.trainer && (
              <div className="text-sm text-muted-foreground">
                Formateur actuel: <strong>{learner.trainer.name}</strong>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="trainer">Nouveau formateur</Label>
              <Select value={selectedTrainerId} onValueChange={setSelectedTrainerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un formateur" />
                </SelectTrigger>
                <SelectContent>
                  {availableTrainers.length === 0 ? (
                    <SelectItem value="" disabled>
                      Aucun formateur disponible
                    </SelectItem>
                  ) : (
                    availableTrainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.name} ({trainer.email})
                      </SelectItem>
                    ))
                  )}
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
              disabled={isSubmitting || !selectedTrainerId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Réattribuer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
