import { BarChart3 } from 'lucide-react'
import { QuestionResultCard } from '@/components/question-result-card'
import type { Doc } from '../../../convex/_generated/dataModel'

interface ResultsSectionProps {
  sortedQuestions: Doc<'questions'>[]
}

export function ResultsSection({ sortedQuestions }: ResultsSectionProps) {
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
          Add questions first, then view results here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedQuestions.map((question, index) => (
        <QuestionResultCard
          key={question._id}
          questionId={question._id}
          title={question.title}
          type={question.type}
          options={question.options}
          index={index}
        />
      ))}
    </div>
  )
}
