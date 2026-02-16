import { Lock, Pencil, Plus } from 'lucide-react'
import { QuestionCard } from './question-card'
import { AddQuestionDropdown } from './add-question-dropdown'
import type { QuestionType } from './constants'
import type { Doc } from '../../../convex/_generated/dataModel'

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
}: QuestionsSectionProps) {
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

      {/* Question list */}
      {sortedQuestions.map((question, index) => (
        <QuestionCard
          key={question._id}
          question={question}
          index={index}
          isEditable={isEditable}
          isEditing={editingQuestion === question._id}
          responseCount={responseCounts?.[question._id] ?? 0}
          questionDraft={questionDraft}
          optionsDraft={optionsDraft}
          onStartEdit={() => onStartEdit(question)}
          onCancelEdit={onCancelEdit}
          onQuestionDraftChange={onQuestionDraftChange}
          onOptionsDraftChange={onOptionsDraftChange}
          onSave={onSaveQuestion}
          onDelete={() => onDeleteQuestion(question._id)}
        />
      ))}

      {/* Bottom add button (for scrolled pages) — only in draft */}
      {isEditable && sortedQuestions.length > 0 && (
        <div className="pt-2">
          <AddQuestionDropdown onAdd={onAddQuestion} variant="dashed" />
        </div>
      )}
    </div>
  )
}
