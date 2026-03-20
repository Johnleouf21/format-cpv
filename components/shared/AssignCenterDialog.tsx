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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, ChevronRight } from 'lucide-react'

interface Center {
  id: string
  name: string
  parentId: string | null
  children?: { id: string; name: string }[]
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

  const parentCenters = centers.filter((c) => !c.parentId)
  const getChildren = (parentId: string) => centers.filter((c) => c.parentId === parentId)

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

        <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
          {parentCenters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun centre créé. Allez dans Admin &gt; Centres pour en créer.
            </p>
          ) : (
            parentCenters.map((parent) => {
              const children = getChildren(parent.id)
              return (
                <div key={parent.id}>
                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <Checkbox
                      checked={selectedIds.includes(parent.id)}
                      onCheckedChange={() => toggleCenter(parent.id)}
                    />
                    <Label className="cursor-pointer font-medium text-sm">{parent.name}</Label>
                  </label>
                  {children.map((child) => (
                    <label key={child.id} className="flex items-center gap-2 cursor-pointer py-1 ml-6">
                      <Checkbox
                        checked={selectedIds.includes(child.id)}
                        onCheckedChange={() => toggleCenter(child.id)}
                      />
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <Label className="cursor-pointer text-sm">{child.name}</Label>
                    </label>
                  ))}
                </div>
              )
            })
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
