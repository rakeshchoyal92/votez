import {
  Plus,
  Timer,
  Trash2,
  BarChart3,
  PieChart,
  CircleDot,
  Copy,
  Loader2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SortableOptions } from './sortable-options'
import type { ChartLayout } from '@/components/chart-type-selector'
import { QUESTION_TYPES, type QuestionType } from './constants'
import type { Doc } from '../../../convex/_generated/dataModel'
import type { SaveStatus } from '@/hooks/useSessionEditor'

type ShowResults = 'always' | 'after_submit' | 'after_close'

interface ContentPanelProps {
  question: Doc<'questions'> | null
  questionDraft: string
  typeDraft: QuestionType
  optionsDraft: string[]
  optionImagesDraft?: string[]
  chartLayoutDraft: ChartLayout
  allowMultipleDraft: boolean
  correctAnswerDraft: string
  showResultsDraft: ShowResults
  timeLimitDraft: number
  onQuestionDraftChange: (val: string) => void
  onTypeChange: (type: QuestionType) => void
  onOptionsDraftChange: (opts: string[]) => void
  onOptionImagesDraftChange?: (images: string[]) => void
  onChartLayoutChange: (val: ChartLayout) => void
  onAllowMultipleChange: (val: boolean) => void
  onCorrectAnswerChange: (val: string) => void
  onShowResultsChange: (val: ShowResults) => void
  onTimeLimitChange: (val: number) => void
  onSave: () => void
  onDelete: () => void
  onDuplicate?: () => void
  isEditable: boolean
  isDraft?: boolean
  saveStatus?: SaveStatus
  slideNumber?: number
}

export function ContentPanel(props: ContentPanelProps) {
  if (!props.question) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-5 h-5 text-muted-foreground/20" />
          </div>
          <p className="text-xs text-muted-foreground/40">
            Select a question to edit
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ContentBody {...props} />
    </div>
  )
}

/* ════════════════════════════════════════════ */
/*  Content Body                                */
/* ════════════════════════════════════════════ */

function ContentBody({
  question,
  typeDraft,
  optionsDraft,
  optionImagesDraft,
  chartLayoutDraft,
  allowMultipleDraft,
  correctAnswerDraft,
  showResultsDraft,
  timeLimitDraft,
  onTypeChange,
  onOptionsDraftChange,
  onOptionImagesDraftChange,
  onChartLayoutChange,
  onAllowMultipleChange,
  onCorrectAnswerChange,
  onShowResultsChange,
  onTimeLimitChange,
  onDelete,
  onDuplicate,
  isEditable,
  isDraft = isEditable,
  saveStatus,
  slideNumber,
}: ContentPanelProps) {
  if (!question) return null

  const isMC = typeDraft === 'multiple_choice'

  return (
    <>
      {/* Header strip with save status */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 flex-shrink-0">
        <span className="text-xs font-medium text-foreground/70">
          {slideNumber ? `Slide ${slideNumber} settings` : 'Settings'}
        </span>
        <SaveStatusIndicator status={saveStatus ?? 'saved'} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Inline type selector */}
          <div className="space-y-2">
            <SectionLabel>Question type</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {QUESTION_TYPES.map((qt) => {
                const Icon = qt.icon
                const isActive = qt.type === typeDraft
                return (
                  <button
                    key={qt.type}
                    type="button"
                    disabled={!isDraft}
                    onClick={() => onTypeChange(qt.type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-medium',
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : isDraft
                          ? 'border-border/30 text-muted-foreground/50 hover:border-primary/30 hover:text-muted-foreground'
                          : 'border-border/30 text-muted-foreground/50',
                      isDraft ? 'cursor-pointer' : 'cursor-default'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {qt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Answer options card (MC only) ── */}
          {isMC && (
            <SettingsCard>
              <SectionLabel>Answer options</SectionLabel>
              {isEditable ? (
                <>
                  <SortableOptions
                    options={optionsDraft}
                    onChange={onOptionsDraftChange}
                    optionImages={optionImagesDraft}
                    onImageChange={onOptionImagesDraftChange}
                    canDelete={isDraft}
                  />
                  {optionsDraft.length < 8 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-primary"
                      onClick={() => onOptionsDraftChange([...optionsDraft, ''])}
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </Button>
                  )}
                </>
              ) : (
                <div className="space-y-1.5">
                  {question.options?.map((opt, i) => (
                    <div key={i} className="text-sm text-foreground px-3 py-2 bg-muted/30 rounded-lg">
                      {opt || `Option ${i + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </SettingsCard>
          )}

          {/* ── Behavior card ── */}
          <SettingsCard>
            <SectionLabel>Behavior</SectionLabel>

            {/* Correct answer — MC only */}
            {isMC && isEditable && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="correct-answer"
                    checked={!!correctAnswerDraft}
                    onCheckedChange={() =>
                      onCorrectAnswerChange(
                        correctAnswerDraft ? '' : (optionsDraft.find((o) => o.trim()) ?? '')
                      )
                    }
                  />
                  <Label htmlFor="correct-answer" className="text-[13px] text-foreground cursor-pointer">
                    Has correct answer(s)
                  </Label>
                </div>
                {correctAnswerDraft && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {optionsDraft.filter((o) => o.trim()).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onCorrectAnswerChange(correctAnswerDraft === opt ? '' : opt)}
                        className={cn(
                          'text-[11px] px-2.5 py-1 rounded-full border transition-all',
                          correctAnswerDraft === opt
                            ? 'border-green-500/60 bg-green-500/10 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10'
                            : 'border-border/40 text-muted-foreground/60 hover:border-green-500/40'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Allow multiple — MC only (structural: draft only) */}
            {isMC && isDraft && (
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="allow-multiple"
                  checked={allowMultipleDraft}
                  onCheckedChange={(checked) => onAllowMultipleChange(checked === true)}
                />
                <Label htmlFor="allow-multiple" className="text-[13px] text-foreground cursor-pointer">
                  Allow picking more than one
                </Label>
              </div>
            )}

            {/* Time limit */}
            {isEditable && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <Label htmlFor="time-limit" className="text-[13px] text-foreground">Time limit</Label>
                  </div>
                  <Switch
                    id="time-limit"
                    checked={timeLimitDraft > 0}
                    onCheckedChange={(on) => onTimeLimitChange(on ? 30 : 0)}
                  />
                </div>
                {timeLimitDraft > 0 && (
                  <div className="flex items-center gap-2 pl-6">
                    <Input
                      type="number"
                      min={5}
                      max={300}
                      value={timeLimitDraft}
                      onChange={(e) => onTimeLimitChange(Number(e.target.value) || 0)}
                      className="h-7 w-20 text-xs text-center"
                    />
                    <span className="text-[11px] text-muted-foreground/50">seconds</span>
                  </div>
                )}
              </div>
            )}
          </SettingsCard>

          {/* ── Results card ── */}
          <SettingsCard>
            <SectionLabel>Results visibility</SectionLabel>
            {isEditable ? (
              <RadioGroup
                value={showResultsDraft}
                onValueChange={(val) => onShowResultsChange(val as ShowResults)}
                className="space-y-1.5"
              >
                {([
                  { value: 'always' as const, label: 'Show results live' },
                  { value: 'after_submit' as const, label: "Show on audience's devices" },
                  { value: 'after_close' as const, label: 'Hide until question closes' },
                ] as const).map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2.5">
                    <RadioGroupItem value={opt.value} id={`results-${opt.value}`} />
                    <Label htmlFor={`results-${opt.value}`} className="text-[13px] text-foreground cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <p className="text-sm text-foreground/70">
                {showResultsDraft === 'always' ? 'Shown live' : showResultsDraft === 'after_submit' ? 'After submit' : 'After close'}
              </p>
            )}
          </SettingsCard>

          {/* ── Chart layout card (MC only) ── */}
          {isMC && (
            <SettingsCard>
              <SectionLabel>Chart layout</SectionLabel>
              <LayoutCardSelector value={chartLayoutDraft} onChange={onChartLayoutChange} />
            </SettingsCard>
          )}

          {/* ── Duplicate button (draft only) ── */}
          {isDraft && onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 font-medium"
              onClick={onDuplicate}
            >
              <Copy className="w-3 h-3" />
              Duplicate question
            </Button>
          )}

          {/* ── Danger zone (draft only) ── */}
          {isDraft && (
            <div className="rounded-lg border border-destructive/20 p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="w-full h-8 text-xs gap-1.5 font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete this question
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════ */
/*  Sub-components                              */
/* ════════════════════════════════════════════ */

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="flex items-center gap-1.5">
      {status === 'saving' && (
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/50" />
      )}
      {status === 'saved' && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      )}
      {status === 'unsaved' && (
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      )}
      <span className={cn(
        'text-[10px] font-medium',
        status === 'saved' ? 'text-muted-foreground/40' : 'text-muted-foreground/60'
      )}>
        {status === 'saving' ? 'Saving...' : status === 'unsaved' ? 'Unsaved' : 'Saved'}
      </span>
    </div>
  )
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold', className)}>
      {children}
    </p>
  )
}

export function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-muted/[0.04] border border-border/15 p-3 space-y-2.5", className)}>
      {children}
    </div>
  )
}

/* ── Card-style layout selector ── */

const LAYOUT_OPTIONS: { value: ChartLayout; icon: typeof BarChart3; label: string }[] = [
  { value: 'bars', icon: BarChart3, label: 'Bars' },
  { value: 'donut', icon: PieChart, label: 'Donut' },
  { value: 'pie', icon: CircleDot, label: 'Pie' },
]

function LayoutCardSelector({
  value,
  onChange,
}: {
  value: ChartLayout
  onChange: (layout: ChartLayout) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {LAYOUT_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
              isActive
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-border/20 hover:border-border/40 bg-muted/[0.02] hover:bg-muted/10'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5',
                isActive ? 'text-primary' : 'text-muted-foreground/30'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground/40'
              )}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
