import { useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
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
import { GripVertical, X, ImagePlus, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MAX_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

interface SortableOptionsProps {
  options: string[]
  onChange: (opts: string[]) => void
  optionImages?: string[]
  onImageChange?: (images: string[]) => void
}

export function SortableOptions({ options, onChange, optionImages, onImageChange }: SortableOptionsProps) {
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

    // Also reorder images in parallel
    if (onImageChange && optionImages) {
      const newImages = [...optionImages]
      while (newImages.length < options.length) newImages.push('')
      const [movedImg] = newImages.splice(oldIndex, 1)
      newImages.splice(newIndex, 0, movedImg)
      onImageChange(newImages)
    }

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

    // Also remove parallel image entry
    if (onImageChange && optionImages) {
      const newImages = [...optionImages]
      newImages.splice(index, 1)
      onImageChange(newImages)
    }

    onChange(newOptions)
  }

  const handleImageUpload = (index: number, storageId: string) => {
    if (!onImageChange) return
    const newImages = [...(optionImages ?? [])]
    while (newImages.length <= index) newImages.push('')
    newImages[index] = storageId
    onImageChange(newImages)
  }

  const handleImageRemove = (index: number) => {
    if (!onImageChange) return
    const newImages = [...(optionImages ?? [])]
    if (index < newImages.length) newImages[index] = ''
    onImageChange(newImages)
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
              imageId={optionImages?.[i] || ''}
              onImageUpload={onImageChange ? (id) => handleImageUpload(i, id) : undefined}
              onImageRemove={onImageChange ? () => handleImageRemove(i) : undefined}
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
  imageId?: string
  onImageUpload?: (storageId: string) => void
  onImageRemove?: () => void
}

function SortableOption({ id, value, index, canRemove, onChange, onRemove, imageId, onImageUpload, onImageRemove }: SortableOptionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl)

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

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only PNG, JPG, and WebP images are accepted')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('Image must be under 2MB')
      return
    }
    setUploading(true)
    try {
      const url = await generateUploadUrl()
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const { storageId } = await res.json()
      onImageUpload?.(storageId)
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
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

      {/* Option image thumbnail or upload button */}
      {onImageUpload && (
        <div className="flex-shrink-0">
          {imageId ? (
            <OptionImageThumb
              storageId={imageId}
              onRemove={onImageRemove}
            />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-lg border border-dashed border-border/40 hover:border-primary/40 flex items-center justify-center transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/40" />
              ) : (
                <ImagePlus className="w-3 h-3 text-muted-foreground/30" />
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

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

function OptionImageThumb({
  storageId,
  onRemove,
}: {
  storageId: string
  onRemove?: () => void
}) {
  const url = useQuery(api.storage.getUrl, { storageId })

  return (
    <div className="relative group w-9 h-9 rounded-lg overflow-hidden border border-border/40">
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-muted/20 animate-pulse" />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  )
}

