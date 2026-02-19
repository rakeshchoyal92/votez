import { useParams, Link, useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Pencil } from 'lucide-react'
import type { Id } from '../../convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSessionAnalytics } from '@/hooks/useSessionAnalytics'
import { OverviewCards } from '@/components/analytics/overview-cards'
import { SessionTimelineChart } from '@/components/analytics/session-timeline-chart'
import { QuestionAnalyticsList } from '@/components/analytics/question-analytics-list'
import { ParticipantTable } from '@/components/analytics/participant-table'

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
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium"
          onClick={() => navigate(`/session/${sessionId}`)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Overview Cards */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
            <OverviewCards
              totalParticipants={analytics.sessionAnalytics?.totalParticipants ?? 0}
              totalResponses={analytics.sessionAnalytics?.totalResponses ?? 0}
              responseRate={analytics.sessionAnalytics?.responseRate ?? 0}
              sessionDuration={analytics.sessionAnalytics?.sessionDuration ?? null}
            />
          </section>

          {/* Response Flow Timeline */}
          {analytics.responseTimeline && analytics.responseTimeline.some(qt => qt.responses.length > 0) && (
            <section>
              <SessionTimelineChart timeline={analytics.responseTimeline} />
            </section>
          )}

          {/* Question Analytics */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Questions ({analytics.sortedQuestions.length})
            </h2>
            <QuestionAnalyticsList
              sortedQuestions={analytics.sortedQuestions}
              totalParticipants={analytics.sessionAnalytics?.totalParticipants ?? 0}
              responseTimeline={analytics.responseTimeline ?? undefined}
            />
          </section>

          {/* Participant Engagement */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Participant Engagement
            </h2>
            <ParticipantTable
              participants={analytics.participantEngagement ?? []}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
