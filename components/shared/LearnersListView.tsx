'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Users, Search, BookOpen, Loader2, GraduationCap } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LearnerParcours {
  id: string
  title: string
  completed: number
  total: number
}

export interface LearnerItem {
  id: string
  name: string
  email: string
  parcours: LearnerParcours[]
  progressSummary: { total: number; completed: number }
  trainer?: { id: string; name: string; email?: string } | null
  centers?: { id: string; name: string }[]
}

interface LearnersListViewProps {
  learners: LearnerItem[]
  isLoading: boolean
  search: string
  onSearchChange: (value: string) => void
  showTrainer?: boolean
  actions: (learner: LearnerItem) => ReactNode
  headerExtra?: ReactNode
  emptyMessage?: string
  emptySubMessage?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressPercent(learner: LearnerItem) {
  if (learner.progressSummary.total === 0) return 0
  return Math.round(
    (learner.progressSummary.completed / learner.progressSummary.total) * 100
  )
}

function getStatusBadge(percentage: number, hasModules: boolean) {
  if (!hasModules) return <Badge variant="outline">Non assigné</Badge>
  if (percentage === 0) return <Badge variant="outline">Non commencé</Badge>
  if (percentage === 100) return <Badge className="bg-green-600 text-white">Terminé</Badge>
  return <Badge variant="secondary">En cours</Badge>
}

function ParcoursDetail({ parcours }: { parcours: LearnerParcours[] }) {
  if (parcours.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Aucun parcours assigné</p>
  }
  return (
    <div className="space-y-2">
      {parcours.map((p) => {
        const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0
        return (
          <div key={p.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/40">
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm flex-1 min-w-0 truncate">{p.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {p.completed}/{p.total}
            </span>
            <Progress value={pct} className="h-1.5 w-16 shrink-0" />
            <span className="text-xs font-medium w-8 text-right shrink-0">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LearnersListView({
  learners,
  isLoading,
  search,
  onSearchChange,
  showTrainer = false,
  actions,
  headerExtra,
  emptyMessage = 'Aucun apprenant pour le moment.',
  emptySubMessage = 'Cliquez sur "Ajouter un apprenant" pour commencer.',
}: LearnersListViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Apprenants ({learners.length})</CardTitle>
            </div>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : learners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{emptyMessage}</p>
            <p className="text-sm">{emptySubMessage}</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="space-y-3 md:hidden">
              {learners.map((learner) => {
                const pct = progressPercent(learner)
                return (
                  <div key={learner.id} className="border rounded-lg p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{learner.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{learner.email}</p>
                      </div>
                      {getStatusBadge(pct, learner.progressSummary.total > 0)}
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-sm text-muted-foreground shrink-0">{pct}%</span>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {showTrainer && learner.trainer && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GraduationCap className="h-3.5 w-3.5" />
                          <span>{learner.trainer.name}</span>
                        </div>
                      )}
                      {learner.parcours.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{learner.parcours.length} parcours</span>
                        </div>
                      )}
                    </div>

                    {/* Parcours detail accordion */}
                    {learner.parcours.length > 0 && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="details" className="border-none">
                          <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                            Détail par parcours
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-0">
                            <ParcoursDetail parcours={learner.parcours} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                      {actions(learner)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: Accordion */}
            <Accordion type="multiple" className="hidden md:block space-y-2">
              {learners.map((learner) => {
                const pct = progressPercent(learner)
                return (
                  <AccordionItem
                    key={learner.id}
                    value={learner.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium truncate">{learner.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{learner.email}</p>
                        </div>
                        {showTrainer && learner.trainer && (
                          <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                            <GraduationCap className="h-4 w-4" />
                            <span>{learner.trainer.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 shrink-0">
                          {learner.parcours.length > 0 && (
                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                              {learner.parcours.length} parcours
                            </Badge>
                          )}
                          {getStatusBadge(pct, learner.progressSummary.total > 0)}
                          <Progress value={pct} className="h-2 w-20" />
                          <span className="text-xs font-medium w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pb-2">
                        <ParcoursDetail parcours={learner.parcours} />
                        <div className="flex items-center gap-2 pt-1">
                          {actions(learner)}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </>
        )}
      </CardContent>
    </Card>
  )
}
