import { useState, useCallback, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id, Doc } from '../../../convex/_generated/dataModel'
import { Users, Heart, BarChart3, ChevronDown, ChevronUp, RotateCcw, Sparkles, X } from 'lucide-react'
import { safeKey } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PollChart } from '@/components/poll-chart'
import { WordCloudDisplay } from '@/components/word-cloud'
import { OpenEndedResults } from '@/components/open-ended-results'
import { RatingResults } from '@/components/rating-results'
import type { ChartLayout } from '@/components/chart-type-selector'
import { findPresetByName } from '@/lib/theme-presets'

type QuestionType = 'multiple_choice' | 'word_cloud' | 'open_ended' | 'rating'

// The listBySession query enriches Doc<'questions'> with resolved image URLs
type EnrichedQuestion = Doc<'questions'> & { optionImageUrls?: (string | null)[] | null }

interface QuestionPreviewProps {
  question: EnrichedQuestion | null
  joinUrl: string
  code: string
  questionDraft?: string
  typeDraft?: QuestionType
  optionsDraft?: string[]
  chartLayoutDraft?: ChartLayout
  correctAnswerDraft?: string
  onQuestionDraftChange?: (val: string) => void
  onResetResults?: (questionId: string) => void
  isEditable?: boolean
  // Live theme preview
  brandBgColor?: string
  brandAccentColor?: string
  brandTextColor?: string
  themePreset?: string
}

export function QuestionPreview({
  question,
  joinUrl,
  code,
  questionDraft,
  typeDraft,
  optionsDraft,
  chartLayoutDraft,
  correctAnswerDraft,
  onQuestionDraftChange,
  onResetResults,
  isEditable,
  brandBgColor,
  brandAccentColor,
  brandTextColor,
  themePreset,
}: QuestionPreviewProps) {
  const [joinBarCollapsed, setJoinBarCollapsed] = useState(false)
  const [simulatedData, setSimulatedData] = useState<{
    counts: Record<string, number>
    total: number
  } | null>(null)

  // Resolve the full preset (rich themes have gradients, patterns, fonts, chart colors)
  const resolvedPreset = useMemo(
    () => (themePreset ? findPresetByName(themePreset) : undefined),
    [themePreset]
  )
  const bgColor = brandBgColor || '#1e293b'
  const textColor = brandTextColor || '#ffffff'
  const accentColor = brandAccentColor || '#6366f1'

  // Build card background style
  const cardBgStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = { backgroundColor: bgColor, color: textColor }
    if (resolvedPreset?.bgGradient) {
      style.backgroundImage = resolvedPreset.bgGradient
    }
    return style
  }, [bgColor, textColor, resolvedPreset])

  // Optional pattern overlay style
  const patternStyle = useMemo<React.CSSProperties | null>(() => {
    if (!resolvedPreset?.bgPattern) return null
    return {
      position: 'absolute',
      inset: 0,
      backgroundImage: resolvedPreset.bgPattern,
      backgroundSize: resolvedPreset.bgPatternSize ?? 'auto',
      opacity: resolvedPreset.bgPatternOpacity ?? 0.5,
      pointerEvents: 'none',
    }
  }, [resolvedPreset])

  const chartColors = resolvedPreset?.chartColors

  const type = (typeDraft ?? question?.type ?? 'multiple_choice') as QuestionType

  const generateSimulation = useCallback(() => {
    if (!question) return
    const counts: Record<string, number> = {}
    let total = 0

    if (type === 'multiple_choice') {
      const opts = (optionsDraft?.filter(o => o.trim()) ?? question.options ?? [])
      opts.forEach(opt => {
        const val = Math.floor(Math.random() * 28) + 3
        counts[safeKey(opt)] = val
        total += val
      })
    } else if (type === 'word_cloud') {
      const words = ['React', 'TypeScript', 'Tailwind', 'Vite', 'Next.js', 'Node', 'GraphQL', 'Docker', 'Python', 'Rust', 'Go', 'Svelte']
      const pick = words.sort(() => Math.random() - 0.5).slice(0, 6 + Math.floor(Math.random() * 4))
      pick.forEach(w => {
        const val = Math.floor(Math.random() * 14) + 1
        counts[w] = val
        total += val
      })
    } else if (type === 'open_ended') {
      const responses = [
        'Great session overall!', 'Very informative content', 'Loved the live demos',
        'More examples please', 'Excellent presentation', 'Could use more Q&A time',
        'Well structured format', 'Engaging and fun',
      ]
      const pick = responses.sort(() => Math.random() - 0.5).slice(0, 4 + Math.floor(Math.random() * 3))
      pick.forEach(r => {
        const val = Math.floor(Math.random() * 4) + 1
        counts[r] = val
        total += val
      })
    } else if (type === 'rating') {
      for (let i = 1; i <= 5; i++) {
        const val = Math.floor(Math.random() * 18) + 2
        counts[String(i)] = val
        total += val
      }
    }

    setSimulatedData({ counts, total })
  }, [question, type, optionsDraft])

  const clearSimulation = useCallback(() => setSimulatedData(null), [])

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center px-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-5">
            <BarChart3 className="w-9 h-9 text-primary/30" />
          </div>
          <p className="text-base font-semibold text-foreground/60 mb-1">No question selected</p>
          <p className="text-sm text-muted-foreground/40">
            Add a slide to start building your presentation
          </p>
        </div>
      </div>
    )
  }

  const displayTitle = questionDraft !== undefined ? questionDraft : question.title

  return (
    <div
      key={question._id}
      className="flex flex-col items-center px-6 lg:px-10 py-6 lg:py-8 min-h-full animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      {/* ── Preview slide card — fixed 16:10 aspect ── */}
      <div
        className="w-full max-w-[680px] aspect-[16/10] rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)] border border-white/[0.08] overflow-hidden flex flex-col relative transition-all duration-300"
        style={cardBgStyle}
      >
        {/* Pattern overlay for rich themes */}
        {patternStyle && <div style={patternStyle} />}

        {/* Join bar — collapsible */}
        <div className="flex-shrink-0 relative z-10">
          {joinBarCollapsed ? (
            <button
              onClick={() => setJoinBarCollapsed(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] transition-colors w-full border-b"
              style={{ color: textColor + '60', borderColor: textColor + '15' }}
            >
              <ChevronDown className="w-3 h-3" />
              Show join info
            </button>
          ) : (
            <div
              className="flex items-center justify-between px-4 py-1.5 border-b"
              style={{ borderColor: textColor + '15' }}
            >
              <div className="flex items-center gap-2 text-xs min-w-0">
                <span style={{ color: textColor + '50' }} className="flex-shrink-0">Join at:</span>
                <span style={{ color: textColor + 'b0' }} className="font-semibold tracking-tight truncate">{joinUrl}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[10px] font-extrabold tracking-[0.15em] uppercase"
                  style={{ color: accentColor + '80' }}
                >
                  Votez
                </span>
                <button
                  onClick={() => setJoinBarCollapsed(true)}
                  className="transition-colors"
                  style={{ color: textColor + '40' }}
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question content — fills remaining space */}
        <div className="flex-1 flex flex-col px-6 lg:px-8 pt-5 pb-4 min-h-0 relative z-10">
          {/* Inline editable title */}
          {isEditable && onQuestionDraftChange ? (
            <div className="mb-4 flex-shrink-0">
              <input
                value={displayTitle}
                onChange={(e) => onQuestionDraftChange(e.target.value)}
                placeholder="Type your question..."
                className="w-full text-lg sm:text-xl lg:text-2xl font-bold text-center bg-transparent border-none outline-none leading-tight focus:ring-0 placeholder:opacity-30"
                style={{ color: textColor, caretColor: accentColor }}
              />
              <div
                className="w-12 h-0.5 mx-auto mt-1.5 rounded-full"
                style={{ backgroundColor: accentColor + '40' }}
              />
            </div>
          ) : (
            <h2
              className="text-lg sm:text-xl lg:text-2xl font-bold text-center mb-4 leading-tight flex-shrink-0"
              style={{ color: textColor }}
            >
              {displayTitle || 'Untitled Question'}
            </h2>
          )}

          {/* Visualization — fills remaining height */}
          <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
            <QuestionVisualization
              question={question}
              typeDraft={typeDraft}
              optionsDraft={optionsDraft}
              chartLayoutDraft={chartLayoutDraft}
              correctAnswerDraft={correctAnswerDraft}
              simulatedData={simulatedData}
              chartColors={chartColors}
            />
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex-shrink-0 relative z-10">
          <PreviewFooter
            questionId={question._id}
            simulatedTotal={simulatedData?.total}
            textColor={textColor}
          />
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="flex items-center gap-2.5 mt-5">
        {simulatedData ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
            onClick={clearSimulation}
          >
            <X className="w-3.5 h-3.5" />
            Clear simulation
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 text-muted-foreground/60"
            onClick={generateSimulation}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulate
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 text-muted-foreground/60"
          onClick={() => onResetResults?.(question._id)}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset results
        </Button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────── */

function PreviewFooter({
  questionId,
  simulatedTotal,
  textColor,
}: {
  questionId: Id<'questions'>
  simulatedTotal?: number
  textColor: string
}) {
  const results = useQuery(api.responses.getResults, { questionId })
  const realTotal = results?.totalResponses ?? 0
  const total = simulatedTotal ?? realTotal

  return (
    <div
      className="flex items-center justify-end gap-4 px-6 py-2 border-t"
      style={{ borderColor: textColor + '12', backgroundColor: textColor + '06' }}
    >
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: textColor + '50' }}>
        <Heart className="w-3 h-3" />
        <span className="tabular-nums">{total}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: textColor + '50' }}>
        <Users className="w-3 h-3" />
        <span className="tabular-nums">{total}</span>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────── */

function QuestionVisualization({
  question,
  typeDraft,
  optionsDraft,
  chartLayoutDraft,
  correctAnswerDraft,
  simulatedData,
  chartColors,
}: {
  question: EnrichedQuestion
  typeDraft?: QuestionType
  optionsDraft?: string[]
  chartLayoutDraft?: ChartLayout
  correctAnswerDraft?: string
  simulatedData: { counts: Record<string, number>; total: number } | null
  chartColors?: string[]
}) {
  const results = useQuery(api.responses.getResults, { questionId: question._id as Id<'questions'> })

  const counts = simulatedData?.counts ?? results?.counts ?? {}
  const total = simulatedData?.total ?? results?.totalResponses ?? 0

  const type = (typeDraft ?? question.type) as QuestionType
  const options = optionsDraft?.filter(o => o.trim()) ?? question.options
  const layout = chartLayoutDraft ?? (question.chartLayout as ChartLayout) ?? 'bars'
  const correctAnswer = correctAnswerDraft !== undefined ? correctAnswerDraft : question.correctAnswer

  if (type === 'multiple_choice' && options && options.length > 0) {
    return (
      <div className="w-full">
        <PollChart
          options={options}
          counts={counts}
          total={total}
          layout={layout}
          size="sm"
          correctAnswer={correctAnswer}
          animated={false}
          showEmpty
          optionImageUrls={question.optionImageUrls}
          chartColors={chartColors}
        />
      </div>
    )
  }

  if (type === 'word_cloud') {
    return (
      <div className="w-full">
        <WordCloudDisplay counts={counts} total={total} size="sm" chartColors={chartColors} />
      </div>
    )
  }

  if (type === 'open_ended') {
    return (
      <div className="w-full">
        <OpenEndedResults counts={counts} total={total} size="sm" />
      </div>
    )
  }

  if (type === 'rating') {
    return (
      <div className="w-full">
        <RatingResults counts={counts} total={total} size="sm" />
      </div>
    )
  }

  return null
}
