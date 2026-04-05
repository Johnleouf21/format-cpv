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
import { Edit, Trash2, GripVertical, Eye } from 'lucide-react'

interface Module {
  id: string
  title: string
  published?: boolean
  parcoursModules: {
    parcoursId: string
    order: number
    parcours: { id: string; title: string }
  }[]
  hasQuiz: boolean
  updatedAt: Date
}

interface ModulesTableProps {
  modules: Module[]
  onDelete: (id: string) => Promise<void>
}

export function ModulesTable({ modules, onDelete }: ModulesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const moduleToDelete = modules.find((m) => m.id === deleteId)

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
            <TableHead className="w-[50px]">Ordre</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Parcours</TableHead>
            <TableHead>Quiz</TableHead>
            <TableHead>Modifié</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Aucun module trouvé
              </TableCell>
            </TableRow>
          ) : (
            modules.map((module) => (
              <TableRow key={module.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    {(module.parcoursModules[0]?.order ?? 0) + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {module.title}
                    {!module.published && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 text-[10px] px-1.5 py-0">
                        Brouillon
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {module.parcoursModules.length > 0 ? (
                    module.parcoursModules.map((pm) => (
                      <Badge key={pm.parcoursId} variant="secondary" className="mr-1">{pm.parcours.title}</Badge>
                    ))
                  ) : (
                    <Badge variant="outline">Non assigné</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {module.hasQuiz ? (
                    <Badge variant="default">Oui</Badge>
                  ) : (
                    <Badge variant="outline">Non</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(module.updatedAt).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild title="Prévisualiser">
                      <Link href={`/admin/modules/${module.id}/preview`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="Modifier">
                      <Link href={`/admin/modules/${module.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(module.id)}
                      title="Supprimer"
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
        title="Supprimer le module"
        description={`Êtes-vous sûr de vouloir supprimer le module "${moduleToDelete?.title}" ? Cette action est irréversible et supprimera également les quiz et la progression associés.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  )
}
