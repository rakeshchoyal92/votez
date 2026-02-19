import { BarChart3 } from 'lucide-react'
import { QuestionAnalyticsCard } from './question-analytics-card'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import type { ChartLayout } from '@/components/chart-type-selector'

interface QuestionAnalyticsListProps {
  sortedQuestions: Doc<'questions'>[]
  totalParticipants: number
  responseTimeline?: {
    questionId: Id<'questions'>
    questionTitle: string
    responses: { answeredAt: number }[]
  }[]
}

export function QuestionAnalyticsList({
  sortedQuestions,
  totalParticipants,
  responseTimeline,
}: QuestionAnalyticsListProps) {
  if (sortedQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-16 sm:py-20 px-6">
        <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-5">
          <BarChart3 className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">
          No questions yet
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          This session has no questions to analyze.
        </p>
      </div>
    )
  }

  // Build a map of question timelines for quick lookup
  const timelineMap = new Map<string, { answeredAt: number }[]>()
  if (responseTimeline) {
    for (const qt of responseTimeline) {
      timelineMap.set(qt.questionId, qt.responses)
    }
  }

  return (
    <div className="space-y-4">
      {sortedQuestions.map((question, index) => (
        <QuestionAnalyticsCard
          key={question._id}
          questionId={question._id}
          title={question.title}
          type={question.type}
          options={question.options}
          index={index}
          chartLayout={question.chartLayout as ChartLayout | undefined}
          correctAnswer={question.correctAnswer}
          totalParticipants={totalParticipants}
          timeline={timelineMap.get(question._id)}
        />
      ))}
    </div>
  )
}
