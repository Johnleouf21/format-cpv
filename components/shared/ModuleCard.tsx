'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Route, Eye, Edit, Trash2, FileQuestion } from 'lucide-react'

interface ModuleCardProps {
  id: string
  title: string
  order: number
  parcoursTitle: string
  hasQuiz?: boolean
  updatedAt?: Date | string
  previewHref: string
  editHref?: string
  onDelete?: () => void
}

export function ModuleCard({
  title,
  order,
  parcoursTitle,
  hasQuiz,
  updatedAt,
  previewHref,
  editHref,
  onDelete,
}: ModuleCardProps) {
  return (
    <Card className="hover:shadow-md transition-all hover:border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 shrink-0">
            <BookOpen className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <span className="truncate">{title}</span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Route className="h-3 w-3" />
            {parcoursTitle}
          </Badge>
          <span className="text-xs">Module {order + 1}</span>
          {hasQuiz !== undefined && (
            <Badge variant={hasQuiz ? 'default' : 'outline'} className="gap-1">
              <FileQuestion className="h-3 w-3" />
              Quiz {hasQuiz ? 'oui' : 'non'}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {updatedAt && (
          <p className="text-xs text-muted-foreground mb-3">
            Modifié le {new Date(updatedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={previewHref}>
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </Link>
          </Button>
          {editHref && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={editHref}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ModuleCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

export function ModuleFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <div>
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  )
}
