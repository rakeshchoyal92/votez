import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { ListChecks, Cloud, MessageSquare, Star, Users, Loader2, CheckCircle2 } from 'lucide-react'
import { PollChart } from './poll-chart'
import { ChartTypeSelector, type ChartLayout } from './chart-type-selector'
import { WordCloudDisplay } from './word-cloud'
import { OpenEndedResults } from './open-ended-results'
import { RatingResults } from './rating-results'
import { Card } from '@/components/ui/card'

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
  chartLayout?: ChartLayout
  correctAnswer?: string
}

export function QuestionResultCard({
  questionId,
  title,
  type,
  options,
  index,
  chartLayout,
  correctAnswer,
}: QuestionResultCardProps) {
  const results = useQuery(api.responses.getResults, { questionId })
  const typeConfig = TYPE_CONFIG[type] ?? TYPE_CONFIG.multiple_choice
  const TypeIcon = typeConfig.icon

  const [localLayout, setLocalLayout] = useState<ChartLayout>(chartLayout ?? 'bars')

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
          <div className="flex items-center gap-3">
            {type === 'multiple_choice' && (
              <ChartTypeSelector value={localLayout} onChange={setLocalLayout} size="sm" />
            )}
            {results && results.totalResponses > 0 && (
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
        </div>
        <h3 className="font-semibold text-foreground text-base sm:text-lg leading-snug">
          {title}
        </h3>
        {correctAnswer && (
          <div className="flex items-center gap-1.5 mt-2 text-green-600 dark:text-green-400 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Correct: {correctAnswer}</span>
          </div>
        )}
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
              <PollChart
                options={options}
                counts={results.counts}
                total={results.totalResponses}
                layout={localLayout}
                correctAnswer={correctAnswer}
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
