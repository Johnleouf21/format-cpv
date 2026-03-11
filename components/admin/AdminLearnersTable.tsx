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
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from './ConfirmDialog'
import { ReassignDialog } from './ReassignDialog'
import { AssignParcoursDialog } from './AssignParcoursDialog'
import { Trash2, ArrowRightLeft, Route } from 'lucide-react'

interface Learner {
  id: string
  name: string
  email: string
  trainer: {
    id: string
    name: string
    email: string
  } | null
  parcours: {
    id: string
    title: string
  } | null
  progress: {
    completed: number
    total: number
    percentage: number
  }
  createdAt: Date
}

interface Trainer {
  id: string
  name: string
  email: string
}

interface Parcours {
  id: string
  title: string
}

interface AdminLearnersTableProps {
  learners: Learner[]
  trainers: Trainer[]
  parcoursList: Parcours[]
  onDelete: (id: string) => Promise<void>
  onReassign: (learnerId: string, trainerId: string) => Promise<void>
  onAssignParcours: (learnerId: string, parcoursId: string | null) => Promise<void>
}

export function AdminLearnersTable({
  learners,
  trainers,
  parcoursList,
  onDelete,
  onReassign,
  onAssignParcours,
}: AdminLearnersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reassignId, setReassignId] = useState<string | null>(null)
  const [assignParcoursId, setAssignParcoursId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const learnerToDelete = learners.find((l) => l.id === deleteId)
  const learnerToReassign = learners.find((l) => l.id === reassignId)
  const learnerToAssignParcours = learners.find((l) => l.id === assignParcoursId)

  async function handleDelete() {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      await onDelete(deleteId)
      setDeleteId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleReassign(trainerId: string) {
    if (!reassignId) return
    await onReassign(reassignId, trainerId)
    setReassignId(null)
  }

  async function handleAssignParcours(parcoursId: string | null) {
    if (!assignParcoursId) return
    await onAssignParcours(assignParcoursId, parcoursId)
    setAssignParcoursId(null)
  }

  function getStatusBadge(percentage: number) {
    if (percentage === 0) {
      return <Badge variant="outline">Non commencé</Badge>
    }
    if (percentage === 100) {
      return <Badge variant="default" className="bg-green-600">Terminé</Badge>
    }
    return <Badge variant="secondary">En cours</Badge>
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Apprenant</TableHead>
            <TableHead>Formateur</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Progression</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {learners.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Aucun apprenant trouvé
              </TableCell>
            </TableRow>
          ) : (
            learners.map((learner) => (
              <TableRow key={learner.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{learner.name}</div>
                    <div className="text-sm text-muted-foreground">{learner.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {learner.trainer ? (
                    <div>
                      <div className="font-medium">{learner.trainer.name}</div>
                      <div className="text-xs text-muted-foreground">{learner.trainer.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {learner.parcours ? (
                    <Badge variant="secondary">{learner.parcours.title}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={learner.progress.percentage} className="h-2" />
                    <span className="text-sm text-muted-foreground">
                      {learner.progress.percentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(learner.progress.percentage)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssignParcoursId(learner.id)}
                      title="Attribuer un parcours"
                    >
                      <Route className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReassignId(learner.id)}
                      title="Réattribuer à un autre formateur"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(learner.id)}
                      title="Supprimer l'apprenant"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer l'apprenant"
        description={`Êtes-vous sûr de vouloir supprimer l'apprenant "${learnerToDelete?.name}" ? Cette action est irréversible et supprimera toute sa progression.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />

      <ReassignDialog
        open={!!reassignId}
        onOpenChange={(open) => !open && setReassignId(null)}
        learner={learnerToReassign}
        trainers={trainers}
        onReassign={handleReassign}
      />

      <AssignParcoursDialog
        open={!!assignParcoursId}
        onOpenChange={(open) => !open && setAssignParcoursId(null)}
        learner={learnerToAssignParcours}
        parcoursList={parcoursList}
        onAssign={handleAssignParcours}
      />
    </>
  )
}
