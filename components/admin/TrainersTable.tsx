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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from './ConfirmDialog'
import { Trash2, Users, Loader2 } from 'lucide-react'

interface Trainer {
  id: string
  name: string
  email: string
  role: string
  learnerCount: number
  createdAt: Date
}

interface TrainersTableProps {
  trainers: Trainer[]
  onRemove: (id: string) => Promise<void>
  onRoleChanged?: () => void
}

export function TrainersTable({ trainers, onRemove, onRoleChanged }: TrainersTableProps) {
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)

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

  async function handleRoleChange(trainerId: string, newRole: string) {
    if (newRole === 'TRAINER') return // no change

    setChangingRoleId(trainerId)
    try {
      const res = await fetch(`/api/users/${trainerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        onRoleChanged?.()
      }
    } catch {
      // Error changing role
    } finally {
      setChangingRoleId(null)
    }
  }

  if (trainers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Aucun formateur trouvé
      </p>
    )
  }

  function RoleSelect({ trainer }: { trainer: Trainer }) {
    if (trainer.role === 'ADMIN') {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
          Admin
        </Badge>
      )
    }
    if (changingRoleId === trainer.id) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    return (
      <Select
        defaultValue="TRAINER"
        onValueChange={(value) => handleRoleChange(trainer.id, value)}
        disabled={trainer.learnerCount > 0}
      >
        <SelectTrigger className="w-32 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TRAINER">Formateur</SelectItem>
          <SelectItem value="LEARNER">Apprenant</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <>
      {/* Mobile: Cards */}
      <div className="space-y-3 md:hidden">
        {trainers.map((trainer) => (
          <div key={trainer.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{trainer.name}</p>
                <p className="text-sm text-muted-foreground truncate">{trainer.email}</p>
              </div>
              <Badge variant="secondary" className="gap-1 shrink-0">
                <Users className="h-3 w-3" />
                {trainer.learnerCount}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <RoleSelect trainer={trainer} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(trainer.createdAt).toLocaleDateString('fr-FR')}</span>
                {trainer.role !== 'ADMIN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRemoveId(trainer.id)}
                    disabled={trainer.learnerCount > 0}
                    title={trainer.learnerCount > 0 ? 'Ce formateur a des apprenants' : 'Retirer le rôle formateur'}
                  >
                    <Trash2 className={`h-4 w-4 ${trainer.learnerCount === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Apprenants</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.map((trainer) => (
              <TableRow key={trainer.id}>
                <TableCell className="font-medium">{trainer.name}</TableCell>
                <TableCell className="text-muted-foreground">{trainer.email}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {trainer.learnerCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RoleSelect trainer={trainer} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(trainer.createdAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  {trainer.role !== 'ADMIN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveId(trainer.id)}
                      disabled={trainer.learnerCount > 0}
                      title={trainer.learnerCount > 0 ? 'Ce formateur a des apprenants' : 'Retirer le rôle formateur'}
                    >
                      <Trash2 className={`h-4 w-4 ${trainer.learnerCount === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
