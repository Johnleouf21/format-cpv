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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AssignParcoursDialog } from '@/components/admin/AssignParcoursDialog'
import { Eye, Route, BookOpen } from 'lucide-react'

interface Learner {
  id: string
  name: string
  email: string
  parcours: {
    id: string
    title: string
  } | null
  progress: {
    completed: number
    total: number
    percentage: number
  }
  lastActivity: string | null
  createdAt: string
}

interface Parcours {
  id: string
  title: string
}

interface LearnersTableProps {
  learners: Learner[]
  parcoursList?: Parcours[]
  onFilterChange?: (filters: { parcoursId?: string; status?: string }) => void
  onAssignParcours?: (learnerId: string, parcoursId: string | null) => Promise<void>
}

function getStatusBadge(percentage: number, total: number) {
  if (total === 0) return <Badge variant="secondary">Non assigné</Badge>
  if (percentage === 100) return <Badge className="bg-green-500 text-white">Complété</Badge>
  if (percentage > 0) return <Badge className="bg-blue-500 text-white">En cours</Badge>
  return <Badge variant="secondary">Non commencé</Badge>
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function LearnersTable({
  learners,
  parcoursList,
  onFilterChange,
  onAssignParcours,
}: LearnersTableProps) {
  const [parcoursFilter, setParcoursFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assignParcoursId, setAssignParcoursId] = useState<string | null>(null)

  const learnerToAssignParcours = learners.find((l) => l.id === assignParcoursId)

  async function handleAssignParcours(parcoursId: string | null) {
    if (!assignParcoursId || !onAssignParcours) return
    await onAssignParcours(assignParcoursId, parcoursId)
    setAssignParcoursId(null)
  }

  const handleParcoursChange = (value: string) => {
    setParcoursFilter(value)
    onFilterChange?.({
      parcoursId: value === 'all' ? undefined : value,
      status: statusFilter === 'all' ? undefined : statusFilter,
    })
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    onFilterChange?.({
      parcoursId: parcoursFilter === 'all' ? undefined : parcoursFilter,
      status: value === 'all' ? undefined : value,
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {parcoursList && parcoursList.length > 0 && (
          <Select value={parcoursFilter} onValueChange={handleParcoursChange}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Filtrer par parcours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les parcours</SelectItem>
              {parcoursList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="not_started">Non commencé</SelectItem>
            <SelectItem value="active">En cours</SelectItem>
            <SelectItem value="completed">Complété</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {learners.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          Aucun apprenant trouvé
        </p>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="space-y-3 md:hidden">
            {learners.map((learner) => (
              <div key={learner.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{learner.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{learner.email}</p>
                  </div>
                  {getStatusBadge(learner.progress.percentage, learner.progress.total)}
                </div>

                <div className="flex items-center gap-2">
                  <Progress value={learner.progress.percentage} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground shrink-0">
                    {learner.progress.completed}/{learner.progress.total}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {learner.parcours && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span className="truncate">{learner.parcours.title}</span>
                    </div>
                  )}
                  <span className="text-xs">
                    Activité : {formatDate(learner.lastActivity)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                  {onAssignParcours && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignParcoursId(learner.id)}
                    >
                      <Route className="h-3.5 w-3.5 mr-1.5" />
                      Parcours
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/trainer/learners/${learner.id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Voir
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apprenant</TableHead>
                  <TableHead>Parcours</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {learners.map((learner) => (
                  <TableRow key={learner.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{learner.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {learner.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {learner.parcours?.title || (
                        <span className="text-muted-foreground">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={learner.progress.percentage}
                          className="w-[100px]"
                        />
                        <span className="text-sm">
                          {learner.progress.completed}/{learner.progress.total}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        learner.progress.percentage,
                        learner.progress.total
                      )}
                    </TableCell>
                    <TableCell>{formatDate(learner.lastActivity)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onAssignParcours && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssignParcoursId(learner.id)}
                            title="Attribuer un parcours"
                          >
                            <Route className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/trainer/learners/${learner.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {onAssignParcours && parcoursList && (
        <AssignParcoursDialog
          open={!!assignParcoursId}
          onOpenChange={(open) => !open && setAssignParcoursId(null)}
          learner={learnerToAssignParcours ? {
            ...learnerToAssignParcours,
            progress: learnerToAssignParcours.progress
          } : null}
          parcoursList={parcoursList}
          onAssign={handleAssignParcours}
        />
      )}
    </div>
  )
}
