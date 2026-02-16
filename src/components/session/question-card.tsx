import { forwardRef } from 'react'
import {
  GripVertical,
  Trash2,
  Plus,
  X,
  Check,
  MessageSquare,
  ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { QUESTION_TYPES } from './constants'
import { SortableOptions } from './sortable-options'
import type { Doc } from '../../../convex/_generated/dataModel'

interface QuestionCardProps {
  question: Doc<'questions'>
  index: number
  isEditable: boolean
  isEditing: boolean
  responseCount: number
  questionDraft: string
  optionsDraft: string[]
  onStartEdit: () => void
  onCancelEdit: () => void
  onQuestionDraftChange: (val: string) => void
  onOptionsDraftChange: (opts: string[]) => void
  onSave: () => void
  onDelete: () => void
  // dnd-kit sortable props
  dragHandleProps?: Record<string, unknown>
  style?: React.CSSProperties
  isDragging?: boolean
}

export const QuestionCard = forwardRef<HTMLDivElement, QuestionCardProps>(
  function QuestionCard(
    {
      question,
      index,
      isEditable,
      isEditing,
      responseCount,
      questionDraft,
      optionsDraft,
      onStartEdit,
      onCancelEdit,
      onQuestionDraftChange,
      onOptionsDraftChange,
      onSave,
      onDelete,
      dragHandleProps,
      style,
      isDragging,
    },
    ref
  ) {
    const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type)
    const TypeIcon = typeConfig?.icon ?? ListChecks
    const hasTitle = question.title.trim().length > 0

    return (
      <Card
        ref={ref}
        style={style}
        className={cn(
          'group border-border/60',
          // Only transition colors/shadows — never transform (dnd-kit controls that)
          !isDragging && 'transition-[border-color,box-shadow,ring-color,opacity] duration-150',
          isEditing
            ? 'ring-2 ring-primary/20 border-primary/30 shadow-sm'
            : 'hover:border-border hover:shadow-sm',
          isDragging && '!opacity-30'
        )}
      >
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-2 pt-1 flex-shrink-0">
            {isEditable && (
              <button
                {...dragHandleProps}
                className="touch-none text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing p-1 -m-1 rounded"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/50 text-xs font-bold text-muted-foreground">
              {index + 1}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">
                    Question
                  </Label>
                  <Input
                    value={questionDraft}
                    onChange={(e) => onQuestionDraftChange(e.target.value)}
                    autoFocus
                    placeholder="Type your question..."
                    className="font-medium"
                  />
                </div>

                {question.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">
                      Options
                    </Label>
                    <SortableOptions
                      options={optionsDraft}
                      onChange={onOptionsDraftChange}
                    />
                    {optionsDraft.length < 8 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-xs px-0 h-auto"
                        onClick={() => onOptionsDraftChange([...optionsDraft, ''])}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add option
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={onSave} className="gap-2">
                    <Check className="w-4 h-4" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={isEditable ? 'cursor-pointer' : ''}
                onClick={() => {
                  if (!isEditable) return
                  onStartEdit()
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TypeIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                    {typeConfig?.label}
                  </span>
                  {responseCount > 0 && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {responseCount}
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'font-medium text-base sm:text-lg mb-2',
                    hasTitle ? 'text-foreground' : 'text-muted-foreground italic'
                  )}
                >
                  {hasTitle ? question.title : 'Untitled Question'}
                </p>
                {question.options && question.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {question.options.map((opt, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className={cn(
                          'font-normal text-xs',
                          !opt.trim() && 'text-muted-foreground italic'
                        )}
                      >
                        {opt.trim() || `Option ${i + 1}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {!isEditing && isEditable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-9 w-9 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    )
  }
)
