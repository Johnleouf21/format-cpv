'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddUserDialog } from '@/components/shared/AddUserDialog'
import { ManageParcoursDialog } from '@/components/shared/ManageParcoursDialog'
import { LearnersListView, type LearnerItem } from '@/components/shared/LearnersListView'
import { Trash2, Settings } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface UserData extends LearnerItem {
  role: string
  createdAt: string
}

interface TrainerLearnersPageClientProps {
  parcoursList: Parcours[]
  trainerId: string
  trainerName: string
}

export function TrainerLearnersPageClient({
  parcoursList,
}: TrainerLearnersPageClientProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [manageParcoursUser, setManageParcoursUser] = useState<LearnerItem | null>(null)
  const [deleteUser, setDeleteUser] = useState<LearnerItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.filter((u: UserData) => u.role === 'LEARNER'))
      }
    } catch {
      // Error fetching users
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async () => {
    if (!deleteUser) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      }
    } catch {
      // Error deleting
    } finally {
      setIsDeleting(false)
      setDeleteUser(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes apprenants</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez vos apprenants et leurs formations
          </p>
        </div>
        <AddUserDialog
          parcoursList={parcoursList}
          onUserAdded={fetchUsers}
        />
      </div>

      <LearnersListView
        learners={users}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        actions={(learner) => (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManageParcoursUser(learner)}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Gérer les parcours
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteUser(learner)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Supprimer
            </Button>
          </>
        )}
      />

      {/* Manage Parcours Dialog */}
      {manageParcoursUser && (
        <ManageParcoursDialog
          open={!!manageParcoursUser}
          onOpenChange={(open) => !open && setManageParcoursUser(null)}
          userId={manageParcoursUser.id}
          userName={manageParcoursUser.name}
          parcoursList={parcoursList}
          currentParcoursIds={manageParcoursUser.parcours.map((p) => p.id)}
          onUpdated={fetchUsers}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;apprenant ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le compte de {deleteUser?.name} ({deleteUser?.email}),
              toute sa progression et ses accès. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
