import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { QRCodeSVG } from 'qrcode.react'
import {
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft,
  Copy,
  Loader2,
  StopCircle,
  Play,
  Star,
  Timer,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn, getChartColor } from '@/lib/utils'
import { ResultsChart } from '@/components/results-chart'
import { WordCloudDisplay } from '@/components/word-cloud'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  const setActiveQuestion = useMutation(api.sessions.setActiveQuestion)

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

  const sortedQuestions = questions.sort((a, b) => a.sortOrder - b.sortOrder)
  const activeQuestion = session.activeQuestionId
    ? sortedQuestions.find((q) => q._id === session.activeQuestionId) ?? null
    : null
  const activeIndex = activeQuestion
    ? sortedQuestions.findIndex((q) => q._id === activeQuestion._id)
    : -1
  const isActive = session.status === 'active'
  const joinUrl = `${window.location.origin}/join/${session.code}`

  const handleStart = async () => {
    await updateStatus({
      sessionId: sessionId as Id<'sessions'>,
      status: 'active',
    })
    if (sortedQuestions.length > 0 && !session.activeQuestionId) {
      await setActiveQuestion({
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
      await setActiveQuestion({
        sessionId: sessionId as Id<'sessions'>,
        questionId: sortedQuestions[activeIndex - 1]._id,
      })
    }
  }

  const handleNext = async () => {
    if (activeIndex < sortedQuestions.length - 1) {
      await setActiveQuestion({
        sessionId: sessionId as Id<'sessions'>,
        questionId: sortedQuestions[activeIndex + 1]._id,
      })
    }
  }

  // Lobby screen (before starting)
  if (!isActive && session.status !== 'ended') {
    return (
      <TooltipProvider>
        <div className="dark presenter-mode flex flex-col items-center justify-center p-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/session/${sessionId}`)}
                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to editor</TooltipContent>
          </Tooltip>

          <h1 className="text-4xl font-bold text-foreground mb-2">{session.title}</h1>
          <p className="text-muted-foreground mb-12">
            {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''}
          </p>

          {/* QR Code */}
          <div className="bg-white rounded-2xl p-6 mb-8">
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
              <span className="text-foreground font-semibold">{participantCount ?? 0}</span>{' '}
              participant{(participantCount ?? 0) !== 1 ? 's' : ''} joined
            </span>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            disabled={sortedQuestions.length === 0}
            className="h-14 px-8 text-lg font-semibold gap-3"
          >
            <Play className="w-5 h-5" />
            Start Presenting
          </Button>
        </div>
      </TooltipProvider>
    )
  }

  // Ended screen
  if (session.status === 'ended') {
    return (
      <div className="dark presenter-mode flex flex-col items-center justify-center p-8">
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
    )
  }

  // Active presentation
  return (
    <TooltipProvider>
      <div className="dark presenter-mode flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/session/${sessionId}`)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to editor</TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-sm font-medium">{session.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{participantCount ?? 0}</span>
            </div>

            <Separator orientation="vertical" className="h-5 bg-foreground/10" />

            <Badge variant="secondary" className="font-mono">
              {activeIndex + 1} / {sortedQuestions.length}
            </Badge>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleEnd}
              className="gap-1.5"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End
            </Button>
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 pb-8">
          {activeQuestion ? (
            <ActiveQuestionView
              question={activeQuestion}
              questionStartedAt={session.questionStartedAt}
            />
          ) : (
            <p className="text-muted-foreground text-lg">No questions to display</p>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/20">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={activeIndex <= 0}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </Button>

          {/* Question dots */}
          <div className="flex items-center gap-2">
            {sortedQuestions.map((q, i) => (
              <Button
                key={q._id}
                variant="ghost"
                size="icon"
                onClick={() =>
                  setActiveQuestion({
                    sessionId: sessionId as Id<'sessions'>,
                    questionId: q._id,
                  })
                }
                className={cn(
                  'w-3 h-3 p-0 rounded-full transition-all',
                  i === activeIndex
                    ? 'bg-primary scale-110 hover:bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={activeIndex >= sortedQuestions.length - 1}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Show the active question with live results
function ActiveQuestionView({
  question,
  questionStartedAt,
}: {
  question: { _id: Id<'questions'>; title: string; type: string; options?: string[]; timeLimit?: number }
  questionStartedAt?: number
}) {
  const results = useQuery(api.responses.getResults, {
    questionId: question._id,
  })

  const timeLimit = question.timeLimit && question.timeLimit > 0 ? question.timeLimit : 0
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!timeLimit || !questionStartedAt) {
      setRemaining(null)
      return
    }
    const update = () => {
      const elapsed = (Date.now() - questionStartedAt) / 1000
      setRemaining(Math.max(0, Math.ceil(timeLimit - elapsed)))
    }
    update()
    const interval = setInterval(update, 250)
    return () => clearInterval(interval)
  }, [timeLimit, questionStartedAt, question._id])

  return (
    <div className="w-full max-w-4xl animate-fade-in">
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-4">
        {question.title}
      </h2>

      {remaining !== null && (
        <div className="flex items-center justify-center gap-2 mb-8">
          <Timer className={cn('w-5 h-5', remaining === 0 ? 'text-destructive' : 'text-muted-foreground')} />
          <span className={cn(
            'text-2xl font-mono font-bold tabular-nums',
            remaining === 0 ? 'text-destructive' : remaining <= 5 ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'
          )}>
            {remaining === 0 ? "Time's up!" : `${remaining}s`}
          </span>
        </div>
      )}

      {remaining === null && <div className="mb-8" />}

      {results && (
        <div className="w-full">
          {question.type === 'multiple_choice' && question.options && (
            <ResultsChart
              options={question.options}
              counts={results.counts}
              total={results.totalResponses}
              size="lg"
            />
          )}

          {question.type === 'word_cloud' && (
            <WordCloudDisplay
              counts={results.counts}
              total={results.totalResponses}
              size="lg"
            />
          )}

          {question.type === 'open_ended' && (
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {Object.entries(results.counts).map(([answer, count], i) => (
                <div
                  key={i}
                  className="px-4 py-3 bg-secondary rounded-xl text-secondary-foreground text-lg"
                >
                  {answer}
                  {count > 1 && (
                    <span className="ml-2 text-muted-foreground text-sm">x{count}</span>
                  )}
                </div>
              ))}
              {results.totalResponses === 0 && (
                <p className="text-muted-foreground text-center text-lg">Waiting for responses...</p>
              )}
            </div>
          )}

          {question.type === 'rating' && (
            <div className="flex items-end justify-center gap-6">
              {[1, 2, 3, 4, 5].map((star) => {
                const count = results.counts[String(star)] ?? 0
                const pct = results.totalResponses > 0 ? (count / results.totalResponses) * 100 : 0
                return (
                  <div key={star} className="flex flex-col items-center gap-2">
                    <div
                      className="w-16 rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(pct * 2, 4)}px`,
                        backgroundColor: getChartColor(star - 1),
                      }}
                    />
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: star }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-star text-star" />
                      ))}
                    </div>
                    <span className="text-muted-foreground text-sm">{count}</span>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-center text-muted-foreground text-sm mt-6">
            {results.totalResponses} response{results.totalResponses !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
