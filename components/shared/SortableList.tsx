'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SortableItemProps {
  id: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

function SortableItem({ id, children, className, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 transition-shadow',
        isDragging && 'z-50 shadow-lg opacity-90',
        className
      )}
      {...attributes}
    >
      {!disabled && (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Glisser pour réordonner"
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

interface SortableListProps<T extends { id: string }> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  itemClassName?: string
  disabled?: boolean
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  itemClassName,
  disabled,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    const newItems = arrayMove(items, oldIndex, newIndex)
    onReorder(newItems)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-2', className)}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              className={itemClassName}
              disabled={disabled}
            >
              {renderItem(item, index)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
