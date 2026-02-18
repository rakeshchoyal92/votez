import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Plus, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { QUESTION_TYPES, QUESTION_TYPE_COLORS } from './constants'
import { AddQuestionDropdown } from './add-question-dropdown'
import type { QuestionType } from './constants'
import type { Doc } from '../../../convex/_generated/dataModel'

interface SlideListProps {
  questions: Doc<'questions'>[]
  selectedId: string | null
  isEditable: boolean
  onSelect: (id: string) => void
  onAddQuestion: (type: QuestionType) => void
  onReorder?: (questionIds: string[]) => void
  responseCounts?: Record<string, number>
  activeQuestionId?: string
  sessionStatus?: string
  onDeselectAll?: () => void
}

export function SlideList({
  questions,
  selectedId,
  isEditable,
  onSelect,
  onAddQuestion,
  onReorder,
  responseCounts,
  activeQuestionId,
  sessionStatus,
  onDeselectAll,
}: SlideListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id || !onReorder) return
    const oldIndex = questions.findIndex((q) => q._id === active.id)
    const newIndex = questions.findIndex((q) => q._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = [...questions]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    onReorder(reordered.map((q) => q._id))
  }

  const activeQuestion = activeId ? questions.find((q) => q._id === activeId) : null
  const activeIndex = activeId ? questions.findIndex((q) => q._id === activeId) : -1
  const questionIds = questions.map((q) => q._id)

  const filteredQuestions = filterText.trim()
    ? questions.filter((q) =>
        q.title.toLowerCase().includes(filterText.toLowerCase()) ||
        q.type.toLowerCase().includes(filterText.toLowerCase())
      )
    : questions

  const isLive = sessionStatus === 'active'

  return (
    <div className="flex flex-col h-full">
      {/* Top: New slide */}
      {isEditable && (
        <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 flex-shrink-0">
          <AddQuestionDropdown onAdd={onAddQuestion} variant="slide" />
        </div>
      )}

      {/* Filter input — show when 6+ slides */}
      {questions.length >= 6 && (
        <div className="px-2.5 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/40" />
            <Input
              placeholder="Filter slides..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
        </div>
      )}

      {/* Slide thumbnails */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-1.5">
        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
              Click "New slide" to add your first question
            </p>
          </div>
        )}

        {filteredQuestions.length > 0 && isEditable && onReorder && !filterText.trim() ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
              {filteredQuestions.map((q) => {
                const index = questions.findIndex((oq) => oq._id === q._id)
                return (
                  <SortableSlideThumbnail
                    key={q._id}
                    question={q}
                    index={index}
                    isSelected={selectedId === q._id}
                    isActive={isLive && activeQuestionId === q._id}
                    responseCount={responseCounts?.[q._id] ?? 0}
                    onClick={() => onSelect(q._id)}
                  />
                )
              })}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeQuestion && (
                <div className="shadow-xl rounded-lg ring-2 ring-primary/20 opacity-95">
                  <SlideThumbnailContent
                    question={activeQuestion}
                    index={activeIndex}
                    isSelected={true}
                    isActive={false}
                    responseCount={0}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          filteredQuestions.map((q) => {
            const index = questions.findIndex((oq) => oq._id === q._id)
            return (
              <SlideThumbnailContent
                key={q._id}
                question={q}
                index={index}
                isSelected={selectedId === q._id}
                isActive={isLive && activeQuestionId === q._id}
                responseCount={responseCounts?.[q._id] ?? 0}
                onClick={() => onSelect(q._id)}
              />
            )
          })
        )}

        {/* Add slide placeholder */}
        {isEditable && questions.length > 0 && (
          <button
            className="flex items-center justify-center w-full rounded-lg border-2 border-dashed border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all h-12 group"
            onClick={() => onAddQuestion('multiple_choice')}
          >
            <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
          </button>
        )}
      </div>

      {/* Session settings shortcut */}
      {onDeselectAll && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-border/30 flex-shrink-0">
          <button
            onClick={onDeselectAll}
            className={cn(
              'flex items-center gap-2 w-full px-2.5 py-2 rounded-lg transition-all text-left',
              selectedId === null
                ? 'bg-primary/[0.04] text-foreground/70'
                : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Session settings</span>
          </button>
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────── */
/*  Slide Thumbnail — Horizontal with accent  */
/* ────────────────────────────────────────── */

function SlideThumbnailContent({
  question,
  index,
  isSelected,
  isActive,
  responseCount,
  onClick,
}: {
  question: Doc<'questions'>
  index: number
  isSelected: boolean
  isActive: boolean
  responseCount: number
  onClick?: () => void
}) {
  const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type)
  const TypeIcon = typeConfig?.icon
  const hasTitle = question.title.trim().length > 0
  const accentColor = QUESTION_TYPE_COLORS[question.type as QuestionType] ?? 'border-l-gray-400'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-lg border cursor-pointer transition-all overflow-hidden border-l-[3px]',
        accentColor,
        isSelected
          ? 'bg-primary/[0.04] border-primary/40 shadow-sm'
          : 'border-border/30 hover:border-border/60 bg-background hover:shadow-sm',
        isActive && 'ring-1 ring-green-500/40'
      )}
    >
      {/* Active indicator (live only) */}
      {isActive && (
        <div className="absolute top-1.5 right-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
      )}

      <div className="px-2.5 py-2">
        {/* Top row: number + title + response count */}
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground/40 leading-none mt-0.5 flex-shrink-0">
            {index + 1}
          </span>
          <p
            className={cn(
              'text-[11px] leading-tight line-clamp-2 flex-1 min-w-0',
              hasTitle
                ? 'text-foreground/70 font-medium'
                : 'text-muted-foreground/30 italic'
            )}
          >
            {hasTitle ? question.title : 'Untitled'}
          </p>
          {responseCount > 0 && (
            <span className="text-[9px] font-medium bg-muted/60 text-muted-foreground/60 rounded-full px-1.5 py-0.5 leading-none flex-shrink-0 tabular-nums">
              {responseCount}
            </span>
          )}
        </div>

        {/* Bottom row: type icon + label */}
        <div className="flex items-center gap-1 mt-1.5 pl-4">
          {TypeIcon && (
            <TypeIcon
              className={cn(
                'w-3 h-3',
                isSelected ? 'text-primary/50' : 'text-muted-foreground/25'
              )}
            />
          )}
          <span
            className={cn(
              'text-[9px] font-medium',
              isSelected ? 'text-primary/50' : 'text-muted-foreground/30'
            )}
          >
            {typeConfig?.label}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────── */
/*  Sortable wrapper                          */
/* ────────────────────────────────────────── */

function SortableSlideThumbnail({
  question,
  index,
  isSelected,
  isActive,
  responseCount,
  onClick,
}: {
  question: Doc<'questions'>
  index: number
  isSelected: boolean
  isActive: boolean
  responseCount: number
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-30')}
      {...attributes}
      {...listeners}
    >
      <SlideThumbnailContent
        question={question}
        index={index}
        isSelected={isSelected}
        isActive={isActive}
        responseCount={responseCount}
        onClick={onClick}
      />
    </div>
  )
}
