'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { Eye, Edit, Trash2, BookOpen, Users, Star } from 'lucide-react'

interface Parcours {
  id: string
  title: string
  description: string
  moduleCount: number
  learnerCount: number
  createdAt: Date
}

interface ParcoursTableProps {
  parcoursList: Parcours[]
  onDelete: (id: string) => Promise<void>
  onEdit: (parcours: Parcours) => void
  ratings?: Record<string, { average: number; count: number }>
}

export function ParcoursTable({ parcoursList, onDelete, onEdit, ratings }: ParcoursTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const parcoursToDelete = parcoursList.find((p) => p.id === deleteId)
  const canDelete = parcoursToDelete?.learnerCount === 0

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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Modules</TableHead>
            <TableHead className="text-center">Apprenants</TableHead>
            <TableHead className="text-center">Note</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcoursList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Aucun parcours trouvé
              </TableCell>
            </TableRow>
          ) : (
            parcoursList.map((parcours) => (
              <TableRow key={parcours.id}>
                <TableCell className="font-medium">{parcours.title}</TableCell>
                <TableCell className="text-muted-foreground max-w-[300px] truncate">
                  {parcours.description || '-'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    {parcours.moduleCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {parcours.learnerCount}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {ratings?.[parcours.id] ? (
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium">{ratings[parcours.id].average}</span>
                      <span className="text-xs text-muted-foreground">({ratings[parcours.id].count})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/parcours/${parcours.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(parcours)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(parcours.id)}
                      disabled={parcours.learnerCount > 0}
                    >
                      <Trash2 className={`h-4 w-4 ${parcours.learnerCount === 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
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
        title="Supprimer le parcours"
        description={
          canDelete
            ? `Êtes-vous sûr de vouloir supprimer le parcours "${parcoursToDelete?.title}" ? Cette action supprimera également tous les modules associés.`
            : 'Ce parcours ne peut pas être supprimé car il a des apprenants actifs.'
        }
        confirmLabel="Supprimer"
        onConfirm={canDelete ? handleDelete : () => setDeleteId(null)}
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  )
}
