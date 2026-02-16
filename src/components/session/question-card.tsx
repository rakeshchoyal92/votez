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
}

export function QuestionCard({
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
}: QuestionCardProps) {
  const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type)
  const TypeIcon = typeConfig?.icon ?? ListChecks

  return (
    <Card
      className={cn(
        'group transition-all duration-150 border-border/60',
        isEditing
          ? 'ring-2 ring-primary/20 border-primary/30 shadow-sm'
          : 'hover:border-border hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 pt-1 flex-shrink-0">
          {isEditable && (
            <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab hidden sm:block" />
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
                  {optionsDraft.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const next = [...optionsDraft]
                          next[i] = e.target.value
                          onOptionsDraftChange(next)
                        }}
                        className="h-9 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (optionsDraft.length <= 2) return
                          onOptionsDraftChange(optionsDraft.filter((_, j) => j !== i))
                        }}
                        disabled={optionsDraft.length <= 2}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {optionsDraft.length < 8 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs px-0 h-auto"
                      onClick={() =>
                        onOptionsDraftChange([...optionsDraft, `Option ${optionsDraft.length + 1}`])
                      }
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
              <p className="font-medium text-foreground text-base sm:text-lg mb-2">
                {question.title}
              </p>
              {question.options && question.options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {question.options.map((opt, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="font-normal text-xs"
                    >
                      {opt}
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
