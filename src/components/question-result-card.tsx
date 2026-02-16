import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { ListChecks, Cloud, MessageSquare, Star, Users, Loader2 } from 'lucide-react'
import { getChartColor } from '@/lib/utils'
import { ResultsChart } from './results-chart'
import { WordCloudDisplay } from './word-cloud'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TYPE_CONFIG: Record<string, { label: string; icon: typeof ListChecks }> = {
  multiple_choice: { label: 'Multiple Choice', icon: ListChecks },
  word_cloud: { label: 'Word Cloud', icon: Cloud },
  open_ended: { label: 'Open Ended', icon: MessageSquare },
  rating: { label: 'Rating', icon: Star },
}

interface QuestionResultCardProps {
  questionId: Id<'questions'>
  title: string
  type: string
  options?: string[]
  index: number
}

export function QuestionResultCard({ questionId, title, type, options, index }: QuestionResultCardProps) {
  const results = useQuery(api.responses.getResults, { questionId })
  const typeConfig = TYPE_CONFIG[type] ?? TYPE_CONFIG.multiple_choice
  const TypeIcon = typeConfig.icon

  return (
    <Card className="overflow-hidden border-border/60 hover:border-border transition-colors duration-150 animate-in fade-in-0">
      {/* Header */}
      <div className="p-5 sm:p-6 pb-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TypeIcon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {typeConfig.label}
              </span>
            </div>
          </div>
          {results && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 rounded-full px-3 py-1">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium tabular-nums">
                {results.totalResponses}
              </span>
              <span className="text-xs">
                response{results.totalResponses !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-foreground text-base sm:text-lg leading-snug">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {!results ? (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : (
          <>
            {type === 'multiple_choice' && options && (
              <ResultsChart
                options={options}
                counts={results.counts}
                total={results.totalResponses}
              />
            )}

            {type === 'word_cloud' && (
              <WordCloudDisplay
                counts={results.counts}
                total={results.totalResponses}
              />
            )}

            {type === 'open_ended' && (
              <OpenEndedResults counts={results.counts} total={results.totalResponses} />
            )}

            {type === 'rating' && (
              <RatingResults counts={results.counts} total={results.totalResponses} />
            )}
          </>
        )}
      </div>
    </Card>
  )
}

function OpenEndedResults({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No responses yet</p>
      </div>
    )
  }

  const entries = Object.entries(counts).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-2.5 max-h-96 overflow-auto">
      {entries.map(([answer, count], i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-4 px-4 py-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
        >
          <span className="text-sm text-foreground flex-1 leading-relaxed">{answer}</span>
          {count > 1 && (
            <Badge variant="secondary" className="font-normal text-xs tabular-nums flex-shrink-0">
              ×{count}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}

function RatingResults({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) {
    return (
      <div className="text-center py-12">
        <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No ratings yet</p>
      </div>
    )
  }

  // Calculate average
  let sum = 0
  for (let i = 1; i <= 5; i++) {
    sum += i * (counts[String(i)] ?? 0)
  }
  const avg = total > 0 ? (sum / total).toFixed(1) : '0'

  const maxCount = Math.max(...[1, 2, 3, 4, 5].map((s) => counts[String(s)] ?? 0), 1)

  return (
    <div className="space-y-6">
      {/* Average rating */}
      <div className="text-center py-4">
        <div className="inline-flex items-baseline gap-2 mb-3">
          <span className="text-5xl font-bold text-foreground tabular-nums">{avg}</span>
          <span className="text-xl text-muted-foreground">/ 5</span>
        </div>
        <div className="flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 transition-colors ${
                star <= Math.round(Number(avg))
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Distribution bars */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[String(star)] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const barWidth = (count / maxCount) * 100

          return (
            <div key={star} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-14 justify-end flex-shrink-0">
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {star}
                </span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-6 bg-muted/40 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-300 ease-out"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: getChartColor(5 - star),
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-20 text-right tabular-nums">
                {count} <span className="text-xs">({pct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
