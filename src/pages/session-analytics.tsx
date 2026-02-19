import { useParams, Link, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Pencil, Download } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSessionAnalytics } from '@/hooks/useSessionAnalytics'
import { useExportPdf } from '@/hooks/useExportPdf'
import { OverviewCards } from '@/components/analytics/overview-cards'
import { SessionTimelineChart } from '@/components/analytics/session-timeline-chart'
import { QuestionAnalyticsCard } from '@/components/analytics/question-analytics-card'
import { ParticipantTable } from '@/components/analytics/participant-table'
import type { ChartLayout } from '@/components/chart-type-selector'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    dot: 'bg-muted-foreground',
  },
  active: {
    label: 'Live',
    variant: 'success' as const,
    dot: 'bg-green-500',
  },
  ended: {
    label: 'Ended',
    variant: 'outline' as const,
    dot: 'bg-muted-foreground/50',
  },
}

export function SessionAnalyticsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const analytics = useSessionAnalytics(sessionId as Id<'sessions'>)
  const { contentRef, exporting, exportPdf } = useExportPdf({
    filename: analytics.session?.title
      ? `${analytics.session.title.replace(/[^a-zA-Z0-9]/g, '_')}_analytics`
      : 'session_analytics',
  })

  if (analytics.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!analytics.session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground mb-4">Session not found</p>
        <Button variant="link" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  const session = analytics.session
  const statusConfig = STATUS_CONFIG[session.status]
  const isLive = session.status === 'active'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-[52px] border-b border-border/50 flex items-center justify-between px-4 flex-shrink-0 bg-background sticky top-0 z-10">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => navigate(`/session/${sessionId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <h1 className="text-sm font-semibold text-foreground truncate max-w-[300px]">
            {session.title}
          </h1>

          <Badge
            variant={statusConfig.variant}
            className="gap-1.5 text-[10px] h-[22px] px-2 flex-shrink-0"
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                statusConfig.dot,
                isLive && 'animate-pulse'
              )}
            />
            {statusConfig.label}
          </Badge>

          <span className="text-xs text-muted-foreground/50 flex-shrink-0">Analytics</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium"
            onClick={exportPdf}
            disabled={exporting}
            data-pdf-exclude
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium"
            onClick={() => navigate(`/session/${sessionId}`)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Page 1: Overview + Response Flow */}
          <section data-pdf-page>
            <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
            <OverviewCards
              totalParticipants={analytics.sessionAnalytics?.totalParticipants ?? 0}
              totalResponses={analytics.sessionAnalytics?.totalResponses ?? 0}
              responseRate={analytics.sessionAnalytics?.responseRate ?? 0}
              sessionDuration={analytics.sessionAnalytics?.sessionDuration ?? null}
            />

            {analytics.responseTimeline && analytics.responseTimeline.some(qt => qt.responses.length > 0) && (
              <div className="mt-8">
                <SessionTimelineChart timeline={analytics.responseTimeline} />
              </div>
            )}
          </section>

          {/* One page per question */}
          {analytics.sortedQuestions.map((question, index) => {
            const timeline = analytics.responseTimeline?.find(qt => qt.questionId === question._id)
            return (
              <section key={question._id} data-pdf-page>
                {index === 0 && (
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Questions ({analytics.sortedQuestions.length})
                  </h2>
                )}
                <QuestionAnalyticsCard
                  questionId={question._id}
                  title={question.title}
                  type={question.type}
                  options={question.options}
                  index={index}
                  chartLayout={question.chartLayout as ChartLayout | undefined}
                  correctAnswer={question.correctAnswer}
                  totalParticipants={analytics.sessionAnalytics?.totalParticipants ?? 0}
                  timeline={timeline?.responses}
                />
              </section>
            )
          })}

          {/* Last page: Participant Engagement */}
          <section data-pdf-page>
            <ParticipantTable
              participants={analytics.participantEngagement ?? []}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
