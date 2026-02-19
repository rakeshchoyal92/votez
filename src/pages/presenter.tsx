import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { QRCodeSVG } from 'qrcode.react'
import {
  Users,
  ArrowLeft,
  Copy,
  Loader2,
  StopCircle,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import { PresenterView } from '@/components/shared'
import type { SessionBranding } from '@/components/shared'
import type { ThemePreset } from '@/components/shared/presenter-view'
import { useGoogleFont } from '@/hooks/useGoogleFont'
import { useReactions } from '@/hooks/useReactions'
import type { ReactionType } from '@/hooks/useReactions'
import type { TimerStyle } from '@/components/presenter-timer'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AnimatedCount } from '@/components/animated-count'
import type { ChartLayout } from '@/components/chart-type-selector'

const REACTION_KEYS: Record<string, ReactionType> = {
  '1': 'drumroll',
  '2': 'applause',
  '3': 'confetti',
  '4': 'hearts',
}

export function PresenterPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const session = useQuery(api.sessions.get, {
    sessionId: sessionId as Id<'sessions'>,
  })
  const questions = useQuery(api.questions.listBySession, {
    sessionId: sessionId as Id<'sessions'>,
  })
  const participantCount = useQuery(api.sessions.getParticipantCount, {
    sessionId: sessionId as Id<'sessions'>,
  })

  const updateStatus = useMutation(api.sessions.updateStatus)
  const setActiveQuestionMutation = useMutation(api.sessions.setActiveQuestion)
  const resetResultsMutation = useMutation(api.responses.resetResults)

  // Presenter state
  const [showQRSidebar, setShowQRSidebar] = useState(true)
  const [showPercentages, setShowPercentages] = useState(true)
  const [chartOverride, setChartOverride] = useState<ChartLayout | null>(null)
  const [timerStyle, setTimerStyle] = useState<TimerStyle>('edge')
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [themeOverride, setThemeOverride] = useState<ThemePreset | null>(null)
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Sync fullscreen state with browser
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }, [])

  // Reactions (must be called unconditionally)
  const { activeReaction, triggerKey, trigger: triggerReaction } = useReactions()

  // Load Google Font for rich themes
  useGoogleFont(themeOverride?.googleFont, themeOverride?.googleFontWeight)

  // Derived state
  const sortedQuestions = questions
    ? [...questions].sort((a, b) => a.sortOrder - b.sortOrder)
    : []
  const activeQuestionId = session?.activeQuestionId ?? null
  const activeQuestion = activeQuestionId
    ? sortedQuestions.find((q) => q._id === activeQuestionId) ?? null
    : null
  const activeIndex = activeQuestion
    ? sortedQuestions.findIndex((q) => q._id === activeQuestion._id)
    : -1
  const isActive = session?.status === 'active'
  const joinUrl = `${window.location.origin}/join/${session?.code ?? ''}`

  const effectiveLayout: ChartLayout =
    chartOverride ?? (activeQuestion?.chartLayout as ChartLayout) ?? 'bars'

  // Build branding object from session, with local theme override
  const branding: SessionBranding | undefined = session ? {
    brandBgColor: themeOverride?.bg ?? session.brandBgColor,
    brandAccentColor: themeOverride?.accent ?? session.brandAccentColor,
    brandTextColor: themeOverride?.text ?? session.brandTextColor,
    brandLogoUrl: session.brandLogoUrl,
    brandBackgroundImageUrl: themeOverride ? undefined : session.brandBackgroundImageUrl,
  } : undefined

  // Live results for active question
  const results = useQuery(
    api.responses.getResults,
    activeQuestionId ? { questionId: activeQuestionId } : 'skip'
  )

  // Timer for timed questions
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const timeLimit =
      activeQuestion?.timeLimit && activeQuestion.timeLimit > 0
        ? activeQuestion.timeLimit
        : 0
    if (!timeLimit || !session?.questionStartedAt) {
      setRemaining(null)
      return
    }
    const update = () => {
      const elapsed = (Date.now() - session.questionStartedAt!) / 1000
      setRemaining(Math.max(0, Math.ceil(timeLimit - elapsed)))
    }
    update()
    const interval = setInterval(update, 250)
    return () => clearInterval(interval)
  }, [activeQuestion?.timeLimit, session?.questionStartedAt, activeQuestion?._id])

  // Auto-advance when timer reaches 0
  const autoAdvanceTriggered = useRef<string | null>(null)

  useEffect(() => {
    if (!autoAdvance || remaining !== 0 || !activeQuestion) return
    // Only trigger once per question (prevent re-triggering on re-renders)
    if (autoAdvanceTriggered.current === activeQuestion._id) return
    if (activeIndex >= sortedQuestions.length - 1) return

    autoAdvanceTriggered.current = activeQuestion._id
    const timeout = setTimeout(() => {
      setChartOverride(null)
      setActiveQuestionMutation({
        sessionId: sessionId as Id<'sessions'>,
        questionId: sortedQuestions[activeIndex + 1]._id,
      })
    }, 3000) // 3s delay to show "Time's up" before advancing

    return () => clearTimeout(timeout)
  }, [autoAdvance, remaining, activeQuestion, activeIndex, sortedQuestions, sessionId, setActiveQuestionMutation])

  // Reset auto-advance guard when question changes
  useEffect(() => {
    autoAdvanceTriggered.current = null
  }, [activeQuestion?._id])

  // Handlers
  const handleStart = async () => {
    await updateStatus({
      sessionId: sessionId as Id<'sessions'>,
      status: 'active',
    })
    if (sortedQuestions.length > 0 && !session?.activeQuestionId) {
      await setActiveQuestionMutation({
        sessionId: sessionId as Id<'sessions'>,
        questionId: sortedQuestions[0]._id,
      })
    }
  }

  const handleEnd = async () => {
    await updateStatus({
      sessionId: sessionId as Id<'sessions'>,
      status: 'ended',
    })
  }

  const handlePrev = async () => {
    if (activeIndex > 0) {
      setChartOverride(null)
      await setActiveQuestionMutation({
        sessionId: sessionId as Id<'sessions'>,
        questionId: sortedQuestions[activeIndex - 1]._id,
      })
    }
  }

  const handleNext = async () => {
    if (activeIndex < sortedQuestions.length - 1) {
      setChartOverride(null)
      await setActiveQuestionMutation({
        sessionId: sessionId as Id<'sessions'>,
        questionId: sortedQuestions[activeIndex + 1]._id,
      })
    }
  }

  const handleResetResults = async () => {
    if (!activeQuestion) return
    await resetResultsMutation({ questionId: activeQuestion._id })
    toast.success('Results cleared')
  }

  // Keyboard shortcuts (only active during presentation)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return
      if (e.key === '?') {
        setShowShortcutOverlay((s) => !s)
        return
      }
      if (e.key === 'Escape') {
        if (showShortcutOverlay) {
          setShowShortcutOverlay(false)
          return
        }
        navigate(`/session/${sessionId}`)
        return
      }
      if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
      else if (e.key === 'q' || e.key === 'Q') setShowQRSidebar((s) => !s)
      else if (e.key === 'f' || e.key === 'F') handleToggleFullscreen()
      else if (REACTION_KEYS[e.key]) triggerReaction(REACTION_KEYS[e.key])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isActive, handlePrev, handleNext, navigate, sessionId, triggerReaction, handleToggleFullscreen, showShortcutOverlay]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Loading state
  if (session === undefined || questions === undefined) {
    return (
      <div className="dark presenter-mode flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="dark presenter-mode flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Session not found</p>
        <Button
          variant="link"
          onClick={() => navigate('/dashboard')}
          className="text-primary"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  // Build presenter-mode inline styles for lobby/ended
  const presenterBrandingStyle: React.CSSProperties = {}
  if (branding?.brandBgColor) presenterBrandingStyle.background = branding.brandBgColor
  if (branding?.brandBackgroundImageUrl) {
    presenterBrandingStyle.backgroundImage = `url(${branding.brandBackgroundImageUrl})`
    presenterBrandingStyle.backgroundSize = 'cover'
    presenterBrandingStyle.backgroundPosition = 'center'
  }
  if (branding?.brandTextColor) presenterBrandingStyle.color = branding.brandTextColor

  // Lobby screen (before starting)
  if (!isActive && session.status !== 'ended') {
    return (
      <PresenterLobby
        session={session}
        sessionId={sessionId!}
        joinUrl={joinUrl}
        sortedQuestions={sortedQuestions}
        participantCount={participantCount ?? 0}
        onStart={handleStart}
        onNavigateBack={() => navigate(`/session/${sessionId}`)}
        branding={branding}
      />
    )
  }

  // Ended screen
  if (session.status === 'ended') {
    return (
      <div className="dark presenter-mode flex flex-col items-center justify-center p-8 relative" style={presenterBrandingStyle}>
        {branding?.brandBackgroundImageUrl && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}
        <div className="relative z-10 flex flex-col items-center">
          {branding?.brandLogoUrl && (
            <img src={branding.brandLogoUrl} alt="Logo" className="h-10 w-auto object-contain mb-6" />
          )}
          <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mb-6">
            <StopCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{session.title}</h1>
          <p className="text-muted-foreground text-lg mb-2">Session ended</p>
          <p className="text-muted-foreground text-sm mb-8">
            {participantCount ?? 0} participant{(participantCount ?? 0) !== 1 ? 's' : ''} joined
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate(`/session/${sessionId}`)}
            >
              View Results
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Active presentation
  return (
    <>
      <PresenterView
        size="full"
        session={session}
        questions={sortedQuestions}
        activeQuestion={activeQuestion}
        activeIndex={activeIndex}
        participantCount={participantCount ?? 0}
        joinUrl={joinUrl}
        results={results ?? null}
        showQRSidebar={showQRSidebar}
        showPercentages={showPercentages}
        chartLayout={effectiveLayout}
        remainingSeconds={remaining}
        timerStyle={timerStyle}
        autoAdvance={autoAdvance}
        onTimerStyleChange={setTimerStyle}
        onToggleAutoAdvance={() => setAutoAdvance(a => !a)}
        branding={branding}
        activeRichTheme={themeOverride}
        activeReaction={activeReaction}
        reactionTriggerKey={triggerKey}
        onTriggerReaction={triggerReaction}
        onPrev={handlePrev}
        onNext={handleNext}
        onSetActiveQuestion={(i) => {
          setChartOverride(null)
          setActiveQuestionMutation({
            sessionId: sessionId as Id<'sessions'>,
            questionId: sortedQuestions[i]._id,
          })
        }}
        onToggleQR={() => setShowQRSidebar(!showQRSidebar)}
        onEnd={handleEnd}
        onNavigateBack={() => navigate(`/session/${sessionId}`)}
        onTogglePercentages={() => setShowPercentages(!showPercentages)}
        onChartOverride={setChartOverride}
        onThemeOverride={setThemeOverride}
        activeThemePreset={themeOverride?.name ?? null}
        onResetResults={handleResetResults}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
      {showShortcutOverlay && (
        <ShortcutOverlay onClose={() => setShowShortcutOverlay(false)} />
      )}
    </>
  )
}

// Shortcut overlay
const SHORTCUTS = [
  { key: '← →', action: 'Previous / Next question' },
  { key: 'Q', action: 'Toggle QR sidebar' },
  { key: 'F', action: 'Toggle fullscreen' },
  { key: 'ESC', action: 'Back to editor' },
  { key: '1', action: 'Drumroll' },
  { key: '2', action: 'Applause' },
  { key: '3', action: 'Confetti' },
  { key: '4', action: 'Hearts' },
  { key: '?', action: 'Toggle shortcuts' },
] as const

function ShortcutOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-background/95 border border-foreground/10 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-foreground mb-5">Keyboard Shortcuts</h3>
        <div className="space-y-3">
          {SHORTCUTS.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{action}</span>
              <kbd className="inline-flex items-center px-2.5 py-1 rounded-md bg-foreground/10 text-xs font-mono font-semibold text-foreground">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/60 mt-6 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 text-[10px] font-mono">?</kbd> or click outside to close
        </p>
      </div>
    </div>
  )
}

// Lobby component
function PresenterLobby({
  session,
  sessionId,
  joinUrl,
  sortedQuestions,
  participantCount,
  onStart,
  onNavigateBack,
  branding,
}: {
  session: { title: string; code: string }
  sessionId: string
  joinUrl: string
  sortedQuestions: { _id: Id<'questions'> }[]
  participantCount: number
  onStart: () => void
  onNavigateBack: () => void
  branding?: SessionBranding
}) {
  const lobbyStyle: React.CSSProperties = {}
  if (branding?.brandBgColor) lobbyStyle.background = branding.brandBgColor
  if (branding?.brandBackgroundImageUrl) {
    lobbyStyle.backgroundImage = `url(${branding.brandBackgroundImageUrl})`
    lobbyStyle.backgroundSize = 'cover'
    lobbyStyle.backgroundPosition = 'center'
  }
  if (branding?.brandTextColor) lobbyStyle.color = branding.brandTextColor

  return (
    <TooltipProvider>
      <div className="dark presenter-mode flex flex-col items-center justify-center p-8 relative" style={lobbyStyle}>
        {branding?.brandBackgroundImageUrl && <div className="absolute inset-0 bg-black/40 pointer-events-none" />}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateBack}
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to editor</TooltipContent>
        </Tooltip>

        <div className="relative z-10 flex flex-col items-center">
        {branding?.brandLogoUrl && (
          <img src={branding.brandLogoUrl} alt="Logo" className="h-10 w-auto object-contain mb-6" />
        )}
        <h1 className="text-4xl font-bold text-foreground mb-2">{session.title}</h1>
        <p className="text-muted-foreground mb-12 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''} ready
        </p>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-6 mb-8 animate-lobby-glow">
          <QRCodeSVG value={joinUrl} size={200} level="M" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <code className="text-3xl font-mono font-bold tracking-[0.3em] text-foreground">
            {session.code}
          </code>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(session.code)
                  toast.success('Code copied!')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy code</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Go to <span className="text-foreground/60 font-medium">{window.location.host}</span> and enter the code
        </p>

        <div className="flex items-center gap-3 mb-12">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg text-muted-foreground">
            <AnimatedCount value={participantCount} className="text-foreground font-semibold" />{' '}
            participant{participantCount !== 1 ? 's' : ''} joined
          </span>
        </div>

        <Button
          size="lg"
          onClick={onStart}
          disabled={sortedQuestions.length === 0}
          className="h-14 px-8 text-lg font-semibold gap-3"
        >
          <Play className="w-5 h-5" />
          Start Presenting
        </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
