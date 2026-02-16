import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SortableOptionsProps {
  options: string[]
  onChange: (opts: string[]) => void
}

export function SortableOptions({ options, onChange }: SortableOptionsProps) {
  // Stable IDs for each option slot
  const [ids] = useState(() => options.map((_, i) => `opt-${i}-${Date.now()}`))

  // Keep ids in sync when options are added
  while (ids.length < options.length) {
    ids.push(`opt-${ids.length}-${Date.now()}`)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const newOptions = [...options]
    const newIds = [...ids]
    const [movedOpt] = newOptions.splice(oldIndex, 1)
    const [movedId] = newIds.splice(oldIndex, 1)
    newOptions.splice(newIndex, 0, movedOpt)
    newIds.splice(newIndex, 0, movedId)

    // Update ids in place
    ids.length = 0
    ids.push(...newIds)

    onChange(newOptions)
  }

  const handleChange = (index: number, value: string) => {
    const next = [...options]
    next[index] = value
    onChange(next)
  }

  const handleRemove = (index: number) => {
    if (options.length <= 2) return
    const newOptions = options.filter((_, j) => j !== index)
    ids.splice(index, 1)
    onChange(newOptions)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <SortableOption
              key={ids[i]}
              id={ids[i]}
              value={opt}
              index={i}
              canRemove={options.length > 2}
              onChange={(val) => handleChange(i, val)}
              onRemove={() => handleRemove(i)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

interface SortableOptionProps {
  id: string
  value: string
  index: number
  canRemove: boolean
  onChange: (val: string) => void
  onRemove: () => void
}

function SortableOption({ id, value, index, canRemove, onChange, onRemove }: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2',
        isDragging && 'opacity-50 z-10'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Option ${index + 1}`}
        className="h-9 text-sm"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={!canRemove}
        className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
