import { forwardRef } from 'react'
import {
  GripVertical,
  Trash2,
  Plus,
  X,
  Check,
  MessageSquare,
  ListChecks,
  Settings2,
  CheckCircle2,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { QUESTION_TYPES } from './constants'
import { SortableOptions } from './sortable-options'
import { ChartTypeSelector, type ChartLayout } from '@/components/chart-type-selector'
import type { Doc } from '../../../convex/_generated/dataModel'

type ShowResults = 'always' | 'after_submit' | 'after_close'

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
      chartLayoutDraft = 'bars',
      onChartLayoutChange,
      allowMultipleDraft = false,
      onAllowMultipleChange,
      correctAnswerDraft = '',
      onCorrectAnswerChange,
      showResultsDraft = 'always',
      onShowResultsChange,
      timeLimitDraft = 0,
      onTimeLimitChange,
      dragHandleProps,
      style,
      isDragging,
    },
    ref
  ) {
    const typeConfig = QUESTION_TYPES.find((t) => t.type === question.type)
    const TypeIcon = typeConfig?.icon ?? ListChecks
    const hasTitle = question.title.trim().length > 0
    const isMC = question.type === 'multiple_choice'

    return (
      <Card
        ref={ref}
        style={style}
        className={cn(
          'group border-border/60',
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

                {isMC && (
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

                {/* Settings section */}
                <div className="border-t border-border/40 pt-4">
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">Settings</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chart layout — MC only */}
                    {isMC && onChartLayoutChange && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Chart Layout</Label>
                        <ChartTypeSelector
                          value={chartLayoutDraft}
                          onChange={onChartLayoutChange}
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Allow multiple — MC only */}
                    {isMC && onAllowMultipleChange && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Allow Multiple</Label>
                        <button
                          type="button"
                          onClick={() => onAllowMultipleChange(!allowMultipleDraft)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            allowMultipleDraft ? 'bg-primary' : 'bg-muted-foreground/20'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              allowMultipleDraft ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    )}

                    {/* Correct answer — MC only */}
                    {isMC && onCorrectAnswerChange && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Correct Answer
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {optionsDraft.filter(o => o.trim()).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => onCorrectAnswerChange(correctAnswerDraft === opt ? '' : opt)}
                              className={cn(
                                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                                correctAnswerDraft === opt
                                  ? 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400'
                                  : 'border-border text-muted-foreground hover:border-green-500/50'
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                          {optionsDraft.filter(o => o.trim()).length === 0 && (
                            <span className="text-xs text-muted-foreground italic">Add options first</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show results timing */}
                    {onShowResultsChange && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Show Results</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {([
                            { value: 'always' as const, label: 'Always' },
                            { value: 'after_submit' as const, label: 'After Submit' },
                            { value: 'after_close' as const, label: 'After Close' },
                          ]).map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => onShowResultsChange(opt.value)}
                              className={cn(
                                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                                showResultsDraft === opt.value
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-muted-foreground hover:border-primary/50'
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Time limit */}
                    {onTimeLimitChange && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          Time Limit
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={300}
                            value={timeLimitDraft || ''}
                            onChange={(e) => onTimeLimitChange(Number(e.target.value) || 0)}
                            placeholder="No limit"
                            className="h-8 w-24 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">seconds</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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
                  {question.allowMultiple && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                      Multi
                    </Badge>
                  )}
                  {question.correctAnswer && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-0.5 text-green-600 dark:text-green-400 border-green-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {question.correctAnswer}
                    </Badge>
                  )}
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
