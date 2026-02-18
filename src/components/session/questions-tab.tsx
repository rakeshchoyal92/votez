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
import { Lock, Pencil, Plus } from 'lucide-react'
import { QuestionCard } from './question-card'
import { AddQuestionDropdown } from './add-question-dropdown'
import type { QuestionType } from './constants'
import type { ChartLayout } from '@/components/chart-type-selector'
import type { Doc } from '../../../convex/_generated/dataModel'

type ShowResults = 'always' | 'after_submit' | 'after_close'

interface QuestionsSectionProps {
  isEditable: boolean
  isLive: boolean
  isEnded: boolean
  sortedQuestions: Doc<'questions'>[]
  editingQuestion: string | null
  questionDraft: string
  optionsDraft: string[]
  responseCounts: Record<string, number> | undefined
  onAddQuestion: (type: QuestionType) => void
  onStartEdit: (question: Doc<'questions'>) => void
  onCancelEdit: () => void
  onQuestionDraftChange: (val: string) => void
  onOptionsDraftChange: (opts: string[]) => void
  onSaveQuestion: () => void
  onDeleteQuestion: (id: string) => void
  onReorderQuestions?: (questionIds: string[]) => void
  // New field props
  chartLayoutDraft?: ChartLayout
  onChartLayoutChange?: (val: ChartLayout) => void
  allowMultipleDraft?: boolean
  onAllowMultipleChange?: (val: boolean) => void
  correctAnswerDraft?: string
  onCorrectAnswerChange?: (val: string) => void
  showResultsDraft?: ShowResults
  onShowResultsChange?: (val: ShowResults) => void
  timeLimitDraft?: number
  onTimeLimitChange?: (val: number) => void
}

export function QuestionsSection({
  isEditable,
  isLive,
  isEnded,
  sortedQuestions,
  editingQuestion,
  questionDraft,
  optionsDraft,
  responseCounts,
  onAddQuestion,
  onStartEdit,
  onCancelEdit,
  onQuestionDraftChange,
  onOptionsDraftChange,
  onSaveQuestion,
  onDeleteQuestion,
  onReorderQuestions,
  chartLayoutDraft,
  onChartLayoutChange,
  allowMultipleDraft,
  onAllowMultipleChange,
  correctAnswerDraft,
  onCorrectAnswerChange,
  showResultsDraft,
  onShowResultsChange,
  timeLimitDraft,
  onTimeLimitChange,
}: QuestionsSectionProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id || !onReorderQuestions) return

    const oldIndex = sortedQuestions.findIndex((q) => q._id === active.id)
    const newIndex = sortedQuestions.findIndex((q) => q._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sortedQuestions]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    onReorderQuestions(reordered.map((q) => q._id))
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeQuestion = activeId ? sortedQuestions.find((q) => q._id === activeId) : null
  const activeIndex = activeId ? sortedQuestions.findIndex((q) => q._id === activeId) : -1
  const questionIds = sortedQuestions.map((q) => q._id)

  const sharedCardProps = (question: Doc<'questions'>, index: number) => ({
    question,
    index,
    isEditable,
    isEditing: editingQuestion === question._id,
    responseCount: responseCounts?.[question._id] ?? 0,
    questionDraft,
    optionsDraft,
    onStartEdit: () => onStartEdit(question),
    onCancelEdit,
    onQuestionDraftChange,
    onOptionsDraftChange,
    onSave: onSaveQuestion,
    onDelete: () => onDeleteQuestion(question._id),
    // Pass new field props only for the editing question
    ...(editingQuestion === question._id ? {
      chartLayoutDraft,
      onChartLayoutChange,
      allowMultipleDraft,
      onAllowMultipleChange,
      correctAnswerDraft,
      onCorrectAnswerChange,
      showResultsDraft,
      onShowResultsChange,
      timeLimitDraft,
      onTimeLimitChange,
    } : {}),
  })

  return (
    <div className="space-y-3">
      {/* Lock banner */}
      {isLive && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Questions are locked while session is live
        </div>
      )}
      {isEnded && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted border border-border/60 text-muted-foreground text-sm">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Session has ended — questions are read-only
        </div>
      )}

      {/* Empty state */}
      {sortedQuestions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-16 sm:py-20 px-6 animate-in fade-in-0 duration-300">
          <div className="relative mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
              <Pencil className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1.5">
            No questions yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
            Add your first question to get started with your polling session
          </p>
          {isEditable && <AddQuestionDropdown onAdd={onAddQuestion} />}
        </div>
      )}

      {/* Question list with drag-and-drop */}
      {sortedQuestions.length > 0 && isEditable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
            {sortedQuestions.map((question, index) => (
              <SortableQuestionCard
                key={question._id}
                {...sharedCardProps(question, index)}
              />
            ))}
          </SortableContext>

          {/* Floating overlay — this is what the user actually sees while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeQuestion && (
              <div className="shadow-2xl rounded-lg ring-2 ring-primary/30 opacity-95">
                <QuestionCard
                  {...sharedCardProps(activeQuestion, activeIndex)}
                  isEditing={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        sortedQuestions.map((question, index) => (
          <QuestionCard
            key={question._id}
            {...sharedCardProps(question, index)}
          />
        ))
      )}

      {/* Bottom add button (for scrolled pages) — only in draft */}
      {isEditable && sortedQuestions.length > 0 && (
        <div className="pt-2">
          <AddQuestionDropdown onAdd={onAddQuestion} variant="dashed" />
        </div>
      )}
    </div>
  )
}

/** Wrapper that wires up useSortable to QuestionCard */
function SortableQuestionCard(
  props: Omit<React.ComponentProps<typeof QuestionCard>, 'dragHandleProps' | 'style' | 'isDragging' | 'ref'>
) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.question._id })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    // Only animate other items shifting — the dragged item is hidden (overlay shows instead)
    transition: isDragging ? 'none' : transition,
  }

  return (
    <QuestionCard
      ref={setNodeRef}
      {...props}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  )
}
