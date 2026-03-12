'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Users, Search, BookOpen, Trash2, Settings, Loader2 } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface UserData {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  parcours: { id: string; title: string; assignedAt: string }[]
  progressSummary: { total: number; completed: number }
}

interface TrainerLearnersPageClientProps {
  parcoursList: Parcours[]
  trainerId: string
  trainerName: string
}

export function TrainerLearnersPageClient({
  parcoursList,
  trainerName,
}: TrainerLearnersPageClientProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [manageParcoursUser, setManageParcoursUser] = useState<UserData | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        // Filter to only show LEARNER role
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

  const progressPercent = (u: UserData) => {
    if (u.progressSummary.total === 0) return 0
    return Math.round((u.progressSummary.completed / u.progressSummary.total) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes apprenants</h1>
          <p className="text-muted-foreground">Gérez vos apprenants et leurs formations</p>
        </div>
        <AddUserDialog
          parcoursList={parcoursList}
          onUserAdded={fetchUsers}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Apprenants ({users.length})</CardTitle>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun apprenant pour le moment.</p>
              <p className="text-sm">Cliquez sur &quot;Ajouter un apprenant&quot; pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Parcours</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.parcours.length === 0 ? (
                            <span className="text-sm text-muted-foreground italic">Aucun</span>
                          ) : (
                            user.parcours.map((p) => (
                              <Badge key={p.id} variant="secondary" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {p.title}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${progressPercent(user)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {progressPercent(user)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Gérer les parcours"
                            onClick={() => setManageParcoursUser(user)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
