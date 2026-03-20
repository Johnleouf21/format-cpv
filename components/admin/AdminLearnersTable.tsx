'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from './ConfirmDialog'
import { ReassignDialog } from './ReassignDialog'
import { ManageParcoursDialog } from '@/components/shared/ManageParcoursDialog'
import { AssignCenterDialog } from '@/components/shared/AssignCenterDialog'
import { LearnersListView, type LearnerItem } from '@/components/shared/LearnersListView'
import { Trash2, ArrowRightLeft, Settings, Eye, Building2 } from 'lucide-react'

interface Learner extends LearnerItem {
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
  search: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  onDelete: (id: string) => Promise<void>
  onReassign: (learnerId: string, trainerId: string) => Promise<void>
  onRefresh: () => void
  headerExtra?: React.ReactNode
}

export function AdminLearnersTable({
  learners,
  trainers,
  parcoursList,
  search,
  onSearchChange,
  isLoading,
  onDelete,
  onReassign,
  onRefresh,
  headerExtra,
}: AdminLearnersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [reassignId, setReassignId] = useState<string | null>(null)
  const [manageParcoursLearner, setManageParcoursLearner] = useState<LearnerItem | null>(null)
  const [centerLearner, setCenterLearner] = useState<LearnerItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const learnerToDelete = learners.find((l) => l.id === deleteId)
  const learnerToReassign = learners.find((l) => l.id === reassignId)

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

  return (
    <>
      <LearnersListView
        learners={learners}
        isLoading={isLoading}
        search={search}
        onSearchChange={onSearchChange}
        showTrainer
        headerExtra={headerExtra}
        emptyMessage="Aucun apprenant trouvé"
        emptySubMessage="Ajoutez un apprenant ou modifiez vos filtres."
        actions={(learner) => (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/learners/${learner.id}`}>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Voir
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManageParcoursLearner(learner)}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Parcours
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCenterLearner(learner)}
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              Centre
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignId(learner.id)}
            >
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
              Réattribuer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteId(learner.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Supprimer
            </Button>
          </>
        )}
      />

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

      {manageParcoursLearner && (
        <ManageParcoursDialog
          open={!!manageParcoursLearner}
          onOpenChange={(open) => !open && setManageParcoursLearner(null)}
          userId={manageParcoursLearner.id}
          userName={manageParcoursLearner.name}
          parcoursList={parcoursList}
          currentParcoursIds={manageParcoursLearner.parcours.map((p) => p.id)}
          onUpdated={onRefresh}
        />
      )}

      {centerLearner && (
        <AssignCenterDialog
          open={!!centerLearner}
          onOpenChange={(open) => !open && setCenterLearner(null)}
          userId={centerLearner.id}
          userName={centerLearner.name}
          currentCenterIds={centerLearner.centers?.map((c) => c.id) || []}
          onUpdated={onRefresh}
        />
      )}
    </>
  )
}
