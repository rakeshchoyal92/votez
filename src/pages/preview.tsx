import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import {
  ArrowLeft,
  Loader2,
  Vote,
  RotateCcw,
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PresenterView, AudienceVotingContent } from '@/components/shared'
import type { SessionBranding, AudienceBranding } from '@/components/shared'
import type { ChartLayout } from '@/components/chart-type-selector'
import { useReactions } from '@/hooks/useReactions'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'

/* ════════════════════════════════════════════════════ */
/*  Local preview state per question                   */
/* ════════════════════════════════════════════════════ */

interface PreviewVotes {
  counts: Record<string, number>
  total: number
}

export function PreviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const session = useQuery(api.sessions.get, { sessionId: sessionId as Id<'sessions'> })
  const questions = useQuery(api.questions.listBySession, { sessionId: sessionId as Id<'sessions'> })

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showQRSidebar, setShowQRSidebar] = useState(true)
  const [showPercentages, setShowPercentages] = useState(true)
  const [chartOverride, setChartOverride] = useState<ChartLayout | null>(null)

  // Local votes keyed by question._id — purely in-memory, never saved
  const [localVotes, setLocalVotes] = useState<Record<string, PreviewVotes>>({})
  // Track submitted state per question
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  // Timer state for preview
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [timeUp, setTimeUp] = useState(false)

  const { activeReaction, triggerKey, trigger: triggerReaction } = useReactions()

  const castVote = useCallback((questionId: string, answer: string) => {
    setLocalVotes((prev) => {
      const existing = prev[questionId] ?? { counts: {}, total: 0 }
      const newCounts = { ...existing.counts }
      // Split comma-separated answers (multi-select) — same logic as backend
      const parts = answer.includes(',')
        ? answer.split(',').map((p) => p.trim()).filter(Boolean)
        : [answer]
      for (const part of parts) {
        newCounts[part] = (newCounts[part] ?? 0) + 1
      }
      return {
        ...prev,
        [questionId]: { counts: newCounts, total: existing.total + 1 },
      }
    })
    setSubmitted((prev) => ({ ...prev, [questionId]: true }))
  }, [])

  const resetVotes = useCallback((questionId: string) => {
    setLocalVotes((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
    setSubmitted((prev) => ({ ...prev, [questionId]: false }))
    setQuestionStartedAt(Date.now())
    setTimeUp(false)
  }, [])

  // Compute sorted questions and current question early (needed by timer effects)
  const sorted = [...(questions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const current = sorted[currentIndex] ?? null

  // Reset timer when question changes
  useEffect(() => {
    if (current) {
      setQuestionStartedAt(Date.now())
      setTimeUp(false)
      setRemaining(null)
    }
  }, [current?._id])

  // Countdown timer for preview
  useEffect(() => {
    const timeLimit = current?.timeLimit && current.timeLimit > 0 ? current.timeLimit : 0
    if (!timeLimit || !questionStartedAt) {
      setRemaining(null)
      return
    }
    const update = () => {
      const elapsed = (Date.now() - questionStartedAt) / 1000
      const left = Math.max(0, Math.ceil(timeLimit - elapsed))
      setRemaining(left)
      if (left === 0) setTimeUp(true)
    }
    update()
    const interval = setInterval(update, 250)
    return () => clearInterval(interval)
  }, [current?.timeLimit, questionStartedAt, current?._id])

  if (session === undefined || questions === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/join/${session?.code ?? ''}`

  // Build branding for presenter view
  const branding: SessionBranding | undefined = session ? {
    brandBgColor: session.brandBgColor,
    brandAccentColor: session.brandAccentColor,
    brandTextColor: session.brandTextColor,
    brandLogoUrl: session.brandLogoUrl,
    brandBackgroundImageUrl: session.brandBackgroundImageUrl,
  } : undefined

  // Build audience branding (for participant screen)
  const audienceBranding: AudienceBranding | undefined = session ? {
    logoUrl: session.brandLogoUrl,
    accentColor: session.brandAccentColor,
    sessionTitle: session.title,
  } : undefined

  const currentVotes: PreviewVotes = current
    ? localVotes[current._id] ?? { counts: {}, total: 0 }
    : { counts: {}, total: 0 }

  // Submitted results for post-submit display in preview
  const isCurrentSubmitted = current ? !!submitted[current._id] : false
  const showResults = current?.showResults ?? 'always'
  const submittedResults =
    isCurrentSubmitted && showResults === 'after_submit' && current && localVotes[current._id]
      ? { counts: localVotes[current._id].counts, totalResponses: localVotes[current._id].total }
      : null

  return (
    <TooltipProvider>
    <div className="h-screen flex flex-col bg-[#f5f5f7] dark:bg-background">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-center px-4 border-b border-border/40 bg-background flex-shrink-0 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 h-8 w-8"
          onClick={() => navigate(`/session/${sessionId}`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          This is a preview of your presentation –{' '}
          <span className="font-semibold text-foreground">"{session?.title}"</span>
        </p>
        {/* Reset button */}
        {current && currentVotes.total > 0 && (
          <button
            className="absolute right-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => resetVotes(current._id)}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Main content — stacked on mobile, side-by-side on lg+ */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 xl:gap-14 p-4 sm:p-6 overflow-auto">

        {/* ═══════════════════════════════════════════ */}
        {/*  Presenter: Monitor mockup (fluid width)   */}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex flex-col items-center w-full lg:flex-1 min-w-0 max-w-[920px]">
          <p className="text-[11px] font-semibold text-muted-foreground/60 mb-3 uppercase tracking-[0.15em]">
            Presenter screen
          </p>

          <div className="relative w-full">
            {/* Monitor bezel */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                padding: '8px 8px 20px 8px',
                background: 'linear-gradient(180deg, #222 0%, #1a1a1a 100%)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {/* Webcam */}
              <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-[#444]" />

              {/* Fluid screen — 16:10 aspect ratio */}
              <div
                className="relative rounded-[3px] overflow-hidden w-full"
                style={{ aspectRatio: '16 / 10' }}
              >
                <PresenterView
                  size="compact"
                  session={{ title: session?.title ?? '', code: session?.code ?? '' }}
                  questions={sorted}
                  activeQuestion={current}
                  activeIndex={currentIndex}
                  participantCount={currentVotes.total}
                  joinUrl={joinUrl}
                  results={{ counts: currentVotes.counts, totalResponses: currentVotes.total }}
                  showQRSidebar={showQRSidebar}
                  showPercentages={showPercentages}
                  chartLayout={chartOverride ?? (current?.chartLayout as ChartLayout) ?? 'bars'}
                  branding={branding}
                  activeReaction={activeReaction}
                  reactionTriggerKey={triggerKey}
                  onTriggerReaction={triggerReaction}
                  onPrev={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  onNext={() => setCurrentIndex(Math.min(sorted.length - 1, currentIndex + 1))}
                  onSetActiveQuestion={(i) => setCurrentIndex(i)}
                  onToggleQR={() => setShowQRSidebar(!showQRSidebar)}
                  onTogglePercentages={() => setShowPercentages(p => !p)}
                  onChartOverride={setChartOverride}
                />
              </div>

              {/* Brand logo on chin */}
              <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2">
                <div className="w-6 h-[3px] rounded-full bg-[#444]" />
              </div>
            </div>

            {/* Monitor stand */}
            <div className="flex justify-center">
              <div
                className="w-[40px] h-[24px]"
                style={{
                  background: 'linear-gradient(90deg, #d0d0d0 0%, #e8e8e8 40%, #e8e8e8 60%, #d0d0d0 100%)',
                  clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                }}
              />
            </div>
            <div className="flex justify-center -mt-[1px]">
              <div
                className="h-[6px] rounded-full"
                style={{
                  width: 100,
                  background: 'linear-gradient(180deg, #e0e0e0 0%, #ccc 100%)',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                }}
              />
            </div>

            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-2 rounded-[50%] opacity-[0.06] blur-[3px] bg-black"
              style={{ width: 160 }}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/*  Participant: iPhone mockup (fixed size)   */}
        {/* ═══════════════════════════════════════════ */}
        <div className="flex flex-col items-center flex-shrink-0">
          <p className="text-[11px] font-semibold text-muted-foreground/60 mb-3 uppercase tracking-[0.15em]">
            Participant screen
          </p>

          <div className="relative">
            <div
              className="relative overflow-hidden"
              style={{
                width: 240,
                height: 490,
                borderRadius: 40,
                padding: 3,
                background: 'linear-gradient(160deg, #4a4a4c 0%, #2c2c2e 30%, #1a1a1c 60%, #2c2c2e 100%)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* Side buttons */}
              <div className="absolute -left-[1px] top-[68px] w-[2px] h-[18px] rounded-l-[1px] bg-[#555]" />
              <div className="absolute -left-[1px] top-[96px] w-[2px] h-[30px] rounded-l-[1px] bg-[#555]" />
              <div className="absolute -left-[1px] top-[132px] w-[2px] h-[30px] rounded-l-[1px] bg-[#555]" />
              <div className="absolute -right-[1px] top-[100px] w-[2px] h-[40px] rounded-r-[1px] bg-[#555]" />

              {/* Screen */}
              <div
                className="bg-background h-full flex flex-col overflow-hidden"
                style={{ borderRadius: 37 }}
              >
                {/* Status bar + Dynamic Island */}
                <div className="relative h-[42px] flex items-end justify-between px-5 pb-0 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-foreground tabular-nums leading-none">9:41</span>
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bg-black"
                    style={{ top: 8, width: 62, height: 18, borderRadius: 20 }}
                  />
                  <div className="flex items-center gap-[3px] leading-none">
                    <svg width="11" height="9" viewBox="0 0 17 11" className="text-foreground">
                      <rect x="0" y="8" width="3" height="3" rx="0.5" fill="currentColor" />
                      <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor" />
                      <rect x="9" y="2" width="3" height="9" rx="0.5" fill="currentColor" />
                      <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor" opacity="0.3" />
                    </svg>
                    <svg width="11" height="9" viewBox="0 0 16 12" className="text-foreground">
                      <path d="M8 11.5a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" fill="currentColor" />
                      <path d="M4.93 7.82a4.38 4.38 0 016.14 0" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      <path d="M2.4 5.3a7.88 7.88 0 0111.2 0" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    </svg>
                    <svg width="18" height="9" viewBox="0 0 27 13" className="text-foreground">
                      <rect x="0.5" y="0.5" width="22" height="12" rx="2.5" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35" />
                      <rect x="2" y="2" width="19" height="9" rx="1.5" fill="currentColor" />
                      <path d="M24 4.5v4a2 2 0 000-4z" fill="currentColor" opacity="0.4" />
                    </svg>
                  </div>
                </div>

                {/* App content — scaled full audience experience */}
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  {current ? (
                    <div
                      style={{
                        width: 375,
                        transform: 'scale(0.624)',
                        transformOrigin: 'top left',
                      }}
                    >
                      <div style={{ height: 681, overflowY: 'auto', overflowX: 'hidden' }}>
                      <AudienceVotingContent
                        question={current}
                        questionIndex={currentIndex}
                        onSubmit={(answer) => castVote(current._id, answer)}
                        isSubmitted={isCurrentSubmitted}
                        remainingSeconds={remaining}
                        isTimeUp={timeUp}
                        submittedResults={submittedResults}
                        totalQuestions={sorted.length}
                        totalSeconds={current.timeLimit && current.timeLimit > 0 ? current.timeLimit : undefined}
                        size="full"
                        branding={audienceBranding}
                      />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 h-full flex flex-col items-center justify-center px-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center mb-2.5">
                        <Vote className="w-4 h-4 text-primary/40" />
                      </div>
                      <p className="text-[11px] text-muted-foreground/50">No question active</p>
                    </div>
                  )}
                </div>

                {/* Home indicator */}
                <div className="flex justify-center pb-[5px] pt-2 flex-shrink-0">
                  <div className="w-[80px] h-[4px] rounded-full bg-foreground/15" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  )
}
