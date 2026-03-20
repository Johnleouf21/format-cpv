'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Route, BookOpen, Users, Eye, Edit, Trash2 } from 'lucide-react'

interface ParcoursCardProps {
  id: string
  title: string
  description?: string
  moduleCount: number
  learnerCount: number
  detailHref: string
  detailLabel?: string
  onEdit?: () => void
  onDelete?: () => void
  canDelete?: boolean
}

export function ParcoursCard({
  title,
  description,
  moduleCount,
  learnerCount,
  detailHref,
  detailLabel = 'Voir',
  onEdit,
  onDelete,
  canDelete = true,
}: ParcoursCardProps) {
  return (
    <Card className="hover:shadow-md transition-all hover:border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50 shrink-0">
            <Route className="h-4.5 w-4.5 text-violet-600" />
          </div>
          <span className="truncate">{title}</span>
        </CardTitle>
        {description && (
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{moduleCount} module{moduleCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{learnerCount} apprenant{learnerCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link href={detailHref}>
              <Eye className="mr-2 h-4 w-4" />
              {detailLabel}
            </Link>
          </Button>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Modifier">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={!canDelete}
              aria-label="Supprimer"
            >
              <Trash2 className={`h-4 w-4 ${canDelete ? 'text-destructive' : 'text-muted-foreground'}`} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ParcoursCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

export function ParcoursDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <div>
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
