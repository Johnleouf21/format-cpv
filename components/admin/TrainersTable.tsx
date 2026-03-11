'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from './ConfirmDialog'
import { Trash2, Users } from 'lucide-react'

interface Trainer {
  id: string
  name: string
  email: string
  learnerCount: number
  createdAt: Date
}

interface TrainersTableProps {
  trainers: Trainer[]
  onRemove: (id: string) => Promise<void>
}

export function TrainersTable({ trainers, onRemove }: TrainersTableProps) {
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const trainerToRemove = trainers.find((t) => t.id === removeId)
  const canRemove = trainerToRemove?.learnerCount === 0

  async function handleRemove() {
    if (!removeId) return

    setIsRemoving(true)
    try {
      await onRemove(removeId)
      setRemoveId(null)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-center">Apprenants</TableHead>
            <TableHead>Inscrit le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trainers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Aucun formateur trouvé
              </TableCell>
            </TableRow>
          ) : (
            trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.name}</TableCell>
                <TableCell className="text-muted-foreground">{trainer.email}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {trainer.learnerCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(trainer.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveId(trainer.id)}
                    disabled={trainer.learnerCount > 0}
                    title={trainer.learnerCount > 0 ? 'Ce formateur a des apprenants' : 'Retirer le rôle formateur'}
                  >
                    <Trash2 className={`h-4 w-4 ${trainer.learnerCount === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Retirer le rôle formateur"
        description={
          canRemove
            ? `Êtes-vous sûr de vouloir retirer le rôle formateur à "${trainerToRemove?.name}" ? L'utilisateur conservera son compte mais perdra l'accès au dashboard formateur.`
            : 'Ce formateur ne peut pas être retiré car il a des apprenants assignés.'
        }
        confirmLabel="Retirer"
        onConfirm={canRemove ? handleRemove : () => setRemoveId(null)}
        isLoading={isRemoving}
        variant="destructive"
      />
    </>
  )
}
