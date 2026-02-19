import { cn } from '@/lib/utils'
import { PollChart } from '@/components/poll-chart'
import { WordCloudDisplay } from '@/components/word-cloud'
import { OpenEndedResults } from '@/components/open-ended-results'
import { RatingResults } from '@/components/rating-results'
import type { ChartLayout } from '@/components/chart-type-selector'

export interface PresenterQuestionContentProps {
  question: {
    title: string
    type: string
    options?: string[]
    correctAnswer?: string
    timeLimit?: number
    optionImageUrls?: (string | null)[] | null
  }
  results: {
    counts: Record<string, number>
    totalResponses: number
  } | null
  chartLayout: ChartLayout
  showPercentages?: boolean
  size?: 'sm' | 'lg'
  chartColors?: string[]
}

/**
 * Unified loading skeleton shown while Convex query is in flight (results === null).
 * Uses flex-1 to fill the stable min-h container in PresenterQuestionContent,
 * preventing height jitter when switching between skeleton → content.
 */
function LoadingSkeleton({ size }: { size: 'sm' | 'lg' }) {
  const sm = size === 'sm'

  return (
    <div className="w-full flex-1 flex flex-col items-center gap-6">
      {/* Ghost title block */}
      <div
        className={cn(
          'rounded-lg bg-foreground/[0.25] animate-hud-breathe',
          sm ? 'h-6 w-2/3' : 'h-8 w-3/5'
        )}
      />

      {/* Ghost chart area — flex-1 fills remaining space in the stable container */}
      <div className="w-full flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Pulsing ring */}
          <svg
            width={sm ? 36 : 48}
            height={sm ? 36 : 48}
            viewBox="0 0 48 48"
            className="animate-hud-breathe"
            style={{ opacity: 0.85 }}
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--primary) / 0.7)"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
          </svg>
          <p className={cn(
            'text-muted-foreground/80 animate-hud-breathe',
            sm ? 'text-xs' : 'text-sm'
          )}>
            Loading results...
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Pure presentational component for displaying a question with live results.
 * Used by both the presenter page (lg) and preview monitor mockup (sm).
 */
export function PresenterQuestionContent({
  question,
  results,
  chartLayout,
  showPercentages = true,
  size = 'lg',
  chartColors,
}: PresenterQuestionContentProps) {
  const sm = size === 'sm'

  // Stable min-height prevents layout jitter when switching between
  // skeleton (results === null) and content (results loaded).
  // animate-fade-in re-triggers on question change via key prop from parent.
  const stableClass = cn(
    'w-full flex flex-col animate-fade-in',
    sm ? 'max-w-[600px] flex-1 min-h-0' : 'max-w-6xl flex-1 min-h-0'
  )

  // Show unified skeleton while query is loading (results not yet returned)
  if (results === null) {
    return (
      <div className={stableClass}>
        <LoadingSkeleton size={size} />
      </div>
    )
  }

  const counts = results.counts ?? {}
  const total = results.totalResponses ?? 0

  return (
    <div className={stableClass}>
      <h2
        className={cn(
          'font-bold text-foreground text-center leading-tight',
          sm
            ? 'text-base sm:text-xl lg:text-2xl mb-3 sm:mb-5'
            : 'text-3xl sm:text-4xl mb-4'
        )}
      >
        {question.title}
      </h2>

      <div className="w-full flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
        {question.type === 'multiple_choice' && question.options && (
          <PollChart
            options={question.options}
            counts={counts}
            total={total}
            layout={chartLayout}
            size={size}
            showPercentage={showPercentages}
            correctAnswer={question.correctAnswer}
            animated={sm}
            chartColors={chartColors}
            optionImageUrls={question.optionImageUrls}
          />
        )}

        {question.type === 'word_cloud' && (
          <WordCloudDisplay
            counts={counts}
            total={total}
            size={size}
            chartColors={chartColors}
          />
        )}

        {question.type === 'open_ended' && (
          <OpenEndedResults
            counts={counts}
            total={total}
            size={size}
          />
        )}

        {question.type === 'rating' && (
          <RatingResults
            counts={counts}
            total={total}
            size={size}
          />
        )}

        {!sm && total > 0 && (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {total} response{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
