'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { CenterCheckboxes } from './CenterCheckboxes'

interface Center {
  id: string
  name: string
  parentId: string | null
}

interface AssignCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
  currentCenterIds?: string[]
  onUpdated: () => void
}

export function AssignCenterDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentCenterIds = [],
  onUpdated,
}: AssignCenterDialogProps) {
  const [centers, setCenters] = useState<Center[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(currentCenterIds)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedIds(currentCenterIds)
      fetch('/api/admin/centers')
        .then((res) => res.ok ? res.json() : [])
        .then(setCenters)
        .catch(() => setCenters([]))
    }
  }, [open, currentCenterIds])

  function toggleCenter(centerId: string) {
    setSelectedIds((prev) =>
      prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/learners/${userId}/center`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centerIds: selectedIds }),
      })
      if (res.ok) {
        onUpdated()
        onOpenChange(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Centres de rattachement</DialogTitle>
          <DialogDescription>
            Sélectionnez les centres pour {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-60 overflow-y-auto border rounded-md p-3">
          {centers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun centre créé. Allez dans Admin &gt; Centres pour en créer.
            </p>
          ) : (
            <CenterCheckboxes
              centers={centers}
              selectedIds={selectedIds}
              onToggle={toggleCenter}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
