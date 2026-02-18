import { useState, useEffect } from 'react'
import {
  Check,
  Star,
  Send,
  Timer,
  Square,
  CheckSquare,
} from 'lucide-react'
import { cn, getChartColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PollChart } from '@/components/poll-chart'
import { AnimatedCount } from '@/components/animated-count'
import type { ChartLayout } from '@/components/chart-type-selector'

export interface AudienceBranding {
  logoUrl?: string | null
  bgColor?: string
  textColor?: string
  accentColor?: string
  backgroundImageUrl?: string | null
}

export interface AudienceVotingContentProps {
  question: {
    _id: string
    title: string
    type: string
    options?: string[]
    allowMultiple?: boolean
    chartLayout?: string
    correctAnswer?: string
  }
  questionIndex: number
  onSubmit: (answer: string) => void
  isSubmitted: boolean
  remainingSeconds?: number | null
  isTimeUp?: boolean
  submittedResults?: {
    counts: Record<string, number>
    totalResponses: number
  } | null
  totalQuestions?: number
  totalSeconds?: number
  size?: 'full' | 'compact'
  branding?: AudienceBranding
}

/** Build inline styles for a branded container (bg color, bg image). */
function buildBrandContainerStyle(branding?: AudienceBranding): React.CSSProperties | undefined {
  if (!branding) return undefined
  const style: React.CSSProperties = {}
  if (branding.bgColor) style.backgroundColor = branding.bgColor
  if (branding.backgroundImageUrl) {
    style.backgroundImage = `url(${branding.backgroundImageUrl})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  return Object.keys(style).length > 0 ? style : undefined
}

/**
 * Pure presentational voting component.
 * Used by both the audience page (full) and preview iPhone mockup (compact).
 * Manages internal UI state (multi-select, text input, rating) and resets on question change.
 */
export function AudienceVotingContent({
  question,
  questionIndex,
  onSubmit,
  isSubmitted,
  remainingSeconds = null,
  isTimeUp = false,
  submittedResults = null,
  totalQuestions,
  totalSeconds,
  size = 'full',
  branding,
}: AudienceVotingContentProps) {
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set())
  const [openText, setOpenText] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)

  const compact = size === 'compact'
  const isMultiSelect = question.allowMultiple === true

  // Reset internal state when the active question changes
  useEffect(() => {
    setSelectedMultiple(new Set())
    setOpenText('')
    setRating(0)
    setHoveredStar(0)
  }, [question._id])

  const toggleMultiOption = (option: string) => {
    setSelectedMultiple((prev) => {
      const next = new Set(prev)
      if (next.has(option)) next.delete(option)
      else next.add(option)
      return next
    })
  }

  const handleMultiSubmit = () => {
    if (selectedMultiple.size === 0) return
    onSubmit(Array.from(selectedMultiple).join(','))
  }

  // ───── Time's up (full mode only) ─────
  if (!compact && isTimeUp && !isSubmitted) {
    const brandBg = buildBrandContainerStyle(branding)
    const hasBgImg = !!branding?.backgroundImageUrl
    return (
      <div key={"timeup-" + question._id} className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in relative" style={brandBg}>
        {hasBgImg && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative z-10 flex flex-col items-center">
          {branding?.logoUrl && (
            <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-6" />
          )}
          <div className="w-18 h-18 bg-amber-500/15 rounded-full flex items-center justify-center mb-5 p-4">
            <Timer className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2" style={branding?.textColor ? { color: branding.textColor } : undefined}>Time&apos;s up!</h2>
          <p className="text-muted-foreground text-sm" style={branding?.textColor ? { color: `${branding.textColor}99` } : undefined}>Waiting for next question...</p>
        </div>
      </div>
    )
  }

  // ───── Submitted state ─────
  if (isSubmitted) {
    return compact ? (
      <CompactSubmitted />
    ) : (
      <FullSubmitted
        question={question}
        questionIndex={questionIndex}
        totalQuestions={totalQuestions}
        submittedResults={submittedResults}
        branding={branding}
      />
    )
  }

  // ───── Voting UI ─────
  return compact ? (
    <CompactVoting
      question={question}
      questionIndex={questionIndex}
      isMultiSelect={isMultiSelect}
      selectedMultiple={selectedMultiple}
      hoveredStar={hoveredStar}
      onSubmit={onSubmit}
      onToggleMulti={toggleMultiOption}
      onMultiSubmit={handleMultiSubmit}
      onSetHoveredStar={setHoveredStar}
    />
  ) : (
    <FullVoting
      question={question}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      totalSeconds={totalSeconds}
      isMultiSelect={isMultiSelect}
      selectedMultiple={selectedMultiple}
      openText={openText}
      rating={rating}
      remainingSeconds={remainingSeconds}
      onSubmit={onSubmit}
      onToggleMulti={toggleMultiOption}
      onMultiSubmit={handleMultiSubmit}
      onSetOpenText={setOpenText}
      onSetRating={setRating}
      branding={branding}
    />
  )
}

// ═══════════════════════════════════════════════════════
//  Compact mode sub-components (preview iPhone mockup)
// ═══════════════════════════════════════════════════════

function CompactSubmitted() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="w-8 h-8 bg-green-500/15 rounded-full flex items-center justify-center mb-2">
        <Check className="w-4 h-4 text-green-600" />
      </div>
      <p className="text-[11px] font-semibold text-foreground mb-0.5">Submitted!</p>
      <p className="text-[9px] text-muted-foreground">Tap an option to vote again</p>
    </div>
  )
}

const SAMPLE_WORDS = ['Amazing', 'Creative', 'Fun', 'Innovative', 'Cool']
const SAMPLE_RESPONSES = ["I think it's great!", 'Needs improvement', 'Love the design']

function CompactVoting({
  question,
  questionIndex,
  isMultiSelect,
  selectedMultiple,
  hoveredStar,
  onSubmit,
  onToggleMulti,
  onMultiSubmit,
  onSetHoveredStar,
}: {
  question: AudienceVotingContentProps['question']
  questionIndex: number
  isMultiSelect: boolean
  selectedMultiple: Set<string>
  hoveredStar: number
  onSubmit: (answer: string) => void
  onToggleMulti: (option: string) => void
  onMultiSubmit: () => void
  onSetHoveredStar: (star: number) => void
}) {
  return (
    <div className="flex flex-col">
      <p className="text-[8px] text-primary font-bold uppercase tracking-[0.15em] text-center mb-1">
        Question {questionIndex + 1}
      </p>
      <h3 className="text-[13px] font-bold text-foreground mb-3 text-center leading-snug">
        {question.title}
      </h3>

      <div className="flex-1">
        {/* MC — single select */}
        {question.type === 'multiple_choice' && question.options && !isMultiSelect && (
          <div className="space-y-1.5">
            {question.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSubmit(opt)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-left active:scale-[0.98]"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getChartColor(i) }}
                />
                <span className="text-[11px] font-medium text-foreground">
                  {opt || `Option ${i + 1}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* MC — multi select */}
        {question.type === 'multiple_choice' && question.options && isMultiSelect && (
          <div className="space-y-1.5">
            <p className="text-[8px] text-muted-foreground text-center mb-0.5">Select one or more</p>
            {question.options.map((opt, i) => {
              const isSelected = selectedMultiple.has(opt)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleMulti(opt)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left active:scale-[0.98]',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/30'
                  )}
                >
                  {isSelected ? (
                    <CheckSquare className="w-3 h-3 text-primary flex-shrink-0" />
                  ) : (
                    <Square className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className="text-[11px] font-medium text-foreground">
                    {opt || `Option ${i + 1}`}
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={onMultiSubmit}
              disabled={selectedMultiple.size === 0}
              className={cn(
                'w-full h-7 rounded-lg flex items-center justify-center gap-1 mt-1 transition-all',
                selectedMultiple.size > 0
                  ? 'bg-primary text-primary-foreground active:scale-[0.98]'
                  : 'bg-muted/30 text-muted-foreground/40'
              )}
            >
              <Send className="w-2.5 h-2.5" />
              <span className="text-[10px] font-semibold">
                Submit{selectedMultiple.size > 0 ? ` (${selectedMultiple.size})` : ''}
              </span>
            </button>
          </div>
        )}

        {/* Word cloud — sample chips */}
        {question.type === 'word_cloud' && (
          <div className="space-y-1.5">
            <p className="text-[8px] text-muted-foreground text-center">Tap a sample word</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {SAMPLE_WORDS.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => onSubmit(word)}
                  className="px-2.5 py-1 rounded-full border border-border/50 text-[10px] font-medium text-foreground hover:border-primary/40 hover:bg-primary/[0.03] transition-all active:scale-95"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Open ended — sample responses */}
        {question.type === 'open_ended' && (
          <div className="space-y-1.5">
            <p className="text-[8px] text-muted-foreground text-center">Tap a sample response</p>
            {SAMPLE_RESPONSES.map((answer) => (
              <button
                key={answer}
                type="button"
                onClick={() => onSubmit(answer)}
                className="w-full px-3 py-2 rounded-lg border border-border/50 text-[10px] font-medium text-foreground text-left hover:border-primary/40 hover:bg-primary/[0.03] transition-all active:scale-[0.98]"
              >
                {answer}
              </button>
            ))}
          </div>
        )}

        {/* Rating — compact stars */}
        {question.type === 'rating' && (
          <div className="flex items-center justify-center gap-1.5 py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSubmit(String(s))}
                onMouseEnter={() => onSetHoveredStar(s)}
                onMouseLeave={() => onSetHoveredStar(0)}
                className="transition-transform active:scale-90"
              >
                <Star
                  className={cn(
                    'w-7 h-7 transition-colors',
                    s <= hoveredStar
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/15'
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//  Full mode sub-components (audience page)
// ═══════════════════════════════════════════════════════

function FullSubmitted({
  question,
  questionIndex,
  totalQuestions,
  submittedResults,
  branding,
}: {
  question: AudienceVotingContentProps['question']
  questionIndex: number
  totalQuestions?: number
  submittedResults: AudienceVotingContentProps['submittedResults']
  branding?: AudienceBranding
}) {
  const progressLabel = totalQuestions
    ? `${questionIndex + 1} of ${totalQuestions} questions answered`
    : undefined

  const brandBg = buildBrandContainerStyle(branding)
  const hasBgImg = !!branding?.backgroundImageUrl
  const brandTextStyle: React.CSSProperties | undefined = branding?.textColor ? { color: branding.textColor } : undefined
  const brandMutedStyle: React.CSSProperties | undefined = branding?.textColor ? { color: `${branding.textColor}99` } : undefined

  if (submittedResults && question.type === 'multiple_choice' && question.options) {
    return (
      <div key={"submitted-" + question._id} className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in relative" style={brandBg}>
        {hasBgImg && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative z-10 flex flex-col items-center w-full">
          {branding?.logoUrl && (
            <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-6" />
          )}
          <div className="w-14 h-14 bg-success/15 rounded-full flex items-center justify-center mb-4">
            <Check className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2" style={brandTextStyle}>Submitted!</h2>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6" style={brandMutedStyle}>
            <span className="font-semibold" style={brandTextStyle}>
              <AnimatedCount value={submittedResults.totalResponses} className="font-semibold" />
            </span>
            <span>response{submittedResults.totalResponses !== 1 ? 's' : ''}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
          <div className="w-full max-w-sm">
            <PollChart
              options={question.options}
              counts={submittedResults.counts}
              total={submittedResults.totalResponses}
              layout={(question.chartLayout as ChartLayout) ?? 'bars'}
              size="sm"
              correctAnswer={question.correctAnswer}
            />
          </div>
          {progressLabel && (
            <p className={cn('text-xs mt-6', !brandMutedStyle && 'text-muted-foreground/60')} style={brandMutedStyle}>{progressLabel}</p>
          )}
          <p className="text-muted-foreground text-sm mt-2 animate-pulse" style={brandMutedStyle}>Waiting for next question...</p>
        </div>
      </div>
    )
  }

  return (
    <div key={"submitted-" + question._id} className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in relative" style={brandBg}>
      {hasBgImg && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 flex flex-col items-center">
        {branding?.logoUrl && (
          <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-6" />
        )}
        <div className="w-18 h-18 bg-success/15 rounded-full flex items-center justify-center mb-5 p-4">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2" style={brandTextStyle}>Submitted!</h2>
        {submittedResults && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2" style={brandMutedStyle}>
            <span className="font-semibold" style={brandTextStyle}>
              <AnimatedCount value={submittedResults.totalResponses} className="font-semibold" />
            </span>
            <span>response{submittedResults.totalResponses !== 1 ? 's' : ''}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
        )}
        {progressLabel && (
          <p className={cn('text-xs mb-2', !brandMutedStyle && 'text-muted-foreground/60')} style={brandMutedStyle}>{progressLabel}</p>
        )}
        <p className="text-muted-foreground text-sm animate-pulse" style={brandMutedStyle}>Waiting for next question...</p>
      </div>
    </div>
  )
}

function FullVoting({
  question,
  questionIndex,
  totalQuestions,
  totalSeconds,
  isMultiSelect,
  selectedMultiple,
  openText,
  rating,
  remainingSeconds,
  onSubmit,
  onToggleMulti,
  onMultiSubmit,
  onSetOpenText,
  onSetRating,
  branding,
}: {
  question: AudienceVotingContentProps['question']
  questionIndex: number
  totalQuestions?: number
  totalSeconds?: number
  isMultiSelect: boolean
  selectedMultiple: Set<string>
  openText: string
  rating: number
  remainingSeconds: number | null | undefined
  onSubmit: (answer: string) => void
  onToggleMulti: (option: string) => void
  onMultiSubmit: () => void
  onSetOpenText: (text: string) => void
  onSetRating: (rating: number) => void
  branding?: AudienceBranding
}) {
  const isTimed = totalSeconds != null && totalSeconds > 0 && remainingSeconds != null
  const progressFraction = totalQuestions ? (questionIndex + 1) / totalQuestions : 0

  // Timer phase logic (matches presenter EdgeTimer)
  const secs = remainingSeconds ?? 0
  const isDone = isTimed && secs === 0
  const isUrgent = isTimed && secs > 0 && secs <= 5
  const isWarning = isTimed && secs > 5 && secs <= 10
  const fraction = isTimed ? Math.min(1, Math.max(0, secs / Math.max(1, totalSeconds))) : 0

  const gradientClass = isDone || isUrgent
    ? 'from-red-500 to-orange-500'
    : isWarning
      ? 'from-amber-500 to-yellow-400'
      : 'from-primary to-blue-400'

  const glowColor = isDone || isUrgent
    ? 'rgba(239,68,68,0.4)'
    : isWarning
      ? 'rgba(245,158,11,0.4)'
      : 'hsl(var(--primary) / 0.4)'

  const badgeClass = isDone || isUrgent
    ? 'text-red-400 border-red-400/40'
    : isWarning
      ? 'text-amber-400 border-amber-300/40'
      : 'text-primary border-primary/40'

  // Branding styles
  const brandBg = buildBrandContainerStyle(branding)
  const hasBgImg = !!branding?.backgroundImageUrl
  const brandTextStyle: React.CSSProperties | undefined = branding?.textColor ? { color: branding.textColor } : undefined

  return (
    <div key={question._id} className="min-h-screen bg-background flex flex-col p-6 animate-fade-in relative" style={brandBg}>
      {hasBgImg && <div className="absolute inset-0 bg-black/40" />}

      {/* Top edge: timer bar (timed) or progress bar (untimed) */}
      {isTimed ? (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 w-full overflow-hidden bg-muted/30">
            {isDone ? (
              <div className="h-full" />
            ) : (
              <div
                className={cn('h-full bg-gradient-to-r transition-[width] duration-1000 ease-linear', gradientClass)}
                style={{
                  width: `${fraction * 100}%`,
                  boxShadow: `0 0 8px ${glowColor}, 0 0 2px ${glowColor}`,
                }}
              />
            )}
          </div>
          <div className="flex justify-end px-3 pt-1.5">
            <span
              className={cn(
                'font-mono font-semibold tabular-nums text-[10px] rounded-full border px-2 py-0.5 backdrop-blur-sm bg-background/60',
                badgeClass,
                isUrgent && 'animate-pulse'
              )}
            >
              {isDone ? "Time's up" : `${secs}s`}
            </span>
          </div>
        </div>
      ) : totalQuestions ? (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-muted/30">
          <div
            className="h-full bg-primary/60 transition-all duration-500 rounded-r-full"
            style={{ width: `${progressFraction * 100}%` }}
          />
        </div>
      ) : null}

      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full relative z-10">
        {branding?.logoUrl && (
          <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-5" />
        )}
        <p className="text-xs text-primary font-semibold mb-3 uppercase tracking-widest">
          Question {questionIndex + 1}{totalQuestions ? ` of ${totalQuestions}` : ''}
        </p>
        <h2 className="text-2xl font-bold text-foreground text-center mb-4 leading-snug" style={brandTextStyle}>
          {question.title}
        </h2>

        <div className="mb-4" />

        {/* MC — single select */}
        {question.type === 'multiple_choice' && question.options && !isMultiSelect && (
          <div className="w-full space-y-3 stagger-children">
            {question.options.map((option, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => onSubmit(option)}
                className="w-full py-4 px-5 h-auto rounded-xl text-left justify-start font-medium text-lg border-2 border-border text-foreground hover:border-primary/30 active:scale-[0.98] transition-all"
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {/* MC — multi select */}
        {question.type === 'multiple_choice' && question.options && isMultiSelect && (
          <div className="w-full space-y-3">
            <p className="text-xs text-muted-foreground text-center mb-1">Select one or more options</p>
            <div className="space-y-3 stagger-children">
              {question.options.map((option, i) => {
                const isSelected = selectedMultiple.has(option)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleMulti(option)}
                    className={cn(
                      'w-full py-4 px-5 rounded-xl text-left font-medium text-lg border-2 transition-all flex items-center gap-3',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-foreground hover:border-primary/30 active:scale-[0.98]'
                    )}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    {option}
                  </button>
                )
              })}
            </div>
            <Button
              onClick={onMultiSubmit}
              disabled={selectedMultiple.size === 0}
              className="w-full h-12 text-base font-medium mt-4"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit ({selectedMultiple.size} selected)
            </Button>
          </div>
        )}

        {/* Word cloud */}
        {question.type === 'word_cloud' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (openText.trim()) onSubmit(openText.trim())
            }}
            className="w-full flex gap-2"
          >
            <Input
              type="text"
              value={openText}
              onChange={(e) => onSetOpenText(e.target.value)}
              placeholder="Type a word or phrase..."
              maxLength={50}
              autoFocus
              className="flex-1 h-12 text-lg"
            />
            <Button
              type="submit"
              disabled={!openText.trim()}
              size="lg"
              className="h-12"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        )}

        {/* Open ended */}
        {question.type === 'open_ended' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (openText.trim()) onSubmit(openText.trim())
            }}
            className="w-full space-y-3"
          >
            <Textarea
              value={openText}
              onChange={(e) => onSetOpenText(e.target.value)}
              placeholder="Type your answer..."
              rows={3}
              autoFocus
              className="text-lg resize-none"
            />
            <Button
              type="submit"
              disabled={!openText.trim()}
              className="w-full h-12"
            >
              <Send className="w-4 h-4" />
              Submit
            </Button>
          </form>
        )}

        {/* Rating */}
        {question.type === 'rating' && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="icon"
                  onClick={() => onSetRating(star)}
                  className="h-14 w-14 transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      'w-12 h-12 transition-colors',
                      star <= rating
                        ? 'fill-star text-star'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </Button>
              ))}
            </div>
            {rating > 0 && (
              <Button
                size="lg"
                onClick={() => onSubmit(String(rating))}
                className="animate-fade-in shadow-sm"
              >
                Submit Rating
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
