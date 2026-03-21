'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronRight } from 'lucide-react'

interface Center {
  id: string
  name: string
  parentId: string | null
}

interface CenterCheckboxesProps {
  centers: Center[]
  selectedIds: string[]
  onToggle: (centerId: string) => void
}

export function CenterCheckboxes({ centers, selectedIds, onToggle }: CenterCheckboxesProps) {
  const parentCenters = centers.filter((c) => !c.parentId)
  const getChildren = (parentId: string) => centers.filter((c) => c.parentId === parentId)

  if (parentCenters.length === 0) return null

  return (
    <div className="space-y-1.5">
      {parentCenters.map((parent) => (
        <div key={parent.id}>
          <label className="flex items-center gap-2 cursor-pointer py-0.5">
            <Checkbox
              checked={selectedIds.includes(parent.id)}
              onCheckedChange={() => onToggle(parent.id)}
            />
            <Label className="cursor-pointer font-medium text-sm">{parent.name}</Label>
          </label>
          {getChildren(parent.id).map((child) => (
            <label key={child.id} className="flex items-center gap-2 cursor-pointer py-0.5 ml-6">
              <Checkbox
                checked={selectedIds.includes(child.id)}
                onCheckedChange={() => onToggle(child.id)}
              />
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <Label className="cursor-pointer text-sm">{child.name}</Label>
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}
