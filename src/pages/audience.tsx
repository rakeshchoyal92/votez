import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Vote, Loader2, Check, Clock } from 'lucide-react'
import { getDeviceId } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AudienceVotingContent, AudienceHeader } from '@/components/shared'
import type { AudienceBranding } from '@/components/shared'

export function AudiencePage() {
  const { code } = useParams<{ code: string }>()
  const [name, setName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [participantId, setParticipantId] = useState<string | null>(null)

  const session = useQuery(api.sessions.getByCode, {
    code: code?.toUpperCase() ?? '',
  })

  const joinSession = useMutation(api.participants.join)

  // Check if we already joined (from localStorage)
  useEffect(() => {
    if (session) {
      const storedParticipant = localStorage.getItem(`votez_participant_${session._id}`)
      if (storedParticipant) {
        setParticipantId(storedParticipant)
        setHasJoined(true)
      }
    }
  }, [session])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-5">
          <Vote className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Session not found</h2>
        <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">
          The code <span className="font-mono font-bold">{code?.toUpperCase()}</span> doesn't match any active session.
        </p>
        <Button variant="outline" asChild>
          <Link to="/">Try another code</Link>
        </Button>
      </div>
    )
  }

  // Join handler
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const id = await joinSession({
        sessionId: session._id,
        uniqueId: getDeviceId(),
        name: name.trim() || undefined,
      })
      const idStr = id as string
      setParticipantId(idStr)
      setHasJoined(true)
      localStorage.setItem(`votez_participant_${session._id}`, idStr)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join session'
      if (message.includes('ended') || message.includes('full')) {
        toast.error(message)
      } else {
        toast.error('Failed to join session')
      }
      console.error(err)
    }
  }

  // Build audience branding for header
  const audienceBranding: AudienceBranding = {
    logoUrl: session.brandLogoUrl,
    accentColor: session.brandAccentColor,
    sessionTitle: session.title,
  }

  // Block joining ended sessions (show ended screen even if not joined)
  if (session.status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex flex-col animate-fade-in">
        <AudienceHeader branding={audienceBranding} />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mb-5">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Session ended</h2>
          <p className="text-muted-foreground text-sm">
            {hasJoined ? 'Thanks for participating!' : 'This session is no longer accepting participants.'}
          </p>
        </div>
      </div>
    )
  }

  // Join screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AudienceHeader branding={audienceBranding} />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xs animate-fade-in">
            <div className="flex flex-col items-center mb-8">
              {session.brandLogoUrl ? (
                <img src={session.brandLogoUrl} alt="Logo" className="h-12 w-auto object-contain mb-5" />
              ) : (
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5">
                  <Vote className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-foreground mb-1">{session.title}</h2>
              <p className="text-muted-foreground text-sm">by {session.presenterName}</p>
            </div>

            <Card className="p-5 shadow-sm border-border/50">
              <form onSubmit={handleJoin} className="space-y-3">
                <Input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-center h-12"
                />
                <Button type="submit" className="w-full h-12 text-base font-medium shadow-sm">
                  Join Session
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Waiting / Active / Ended states
  if (session.status === 'draft') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AudienceHeader branding={audienceBranding} />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="animate-pulse-soft">
            <Clock className="w-14 h-14 text-primary/70 mx-auto mb-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Waiting to start...</h2>
          <p className="text-muted-foreground text-sm">The presenter hasn't started yet</p>
        </div>
      </div>
    )
  }

  // Active — show the current question for voting
  return (
    <ActiveQuestionVoter
      sessionId={session._id}
      participantId={participantId as Id<'participants'>}
      activeQuestionId={session.activeQuestionId}
      questionStartedAt={session.questionStartedAt}
      branding={audienceBranding}
    />
  )
}

/**
 * Thin wrapper: manages Convex queries/mutations, timer, and submitted state.
 * Delegates all rendering to the shared AudienceVotingContent component.
 */
function ActiveQuestionVoter({
  sessionId,
  participantId,
  activeQuestionId,
  questionStartedAt,
  branding,
}: {
  sessionId: Id<'sessions'>
  participantId: Id<'participants'>
  activeQuestionId?: Id<'questions'>
  questionStartedAt?: number
  branding?: AudienceBranding
}) {
  const questions = useQuery(api.questions.listBySession, { sessionId })
  const submitResponse = useMutation(api.responses.submit)

  const [submitted, setSubmitted] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  const sortedQuestions = questions?.sort((a, b) => a.sortOrder - b.sortOrder) ?? []
  const question = activeQuestionId
    ? sortedQuestions.find((q) => q._id === activeQuestionId) ?? null
    : null
  const activeQuestionIndex = question
    ? sortedQuestions.findIndex((q) => q._id === question._id)
    : -1

  const showResults = question?.showResults ?? 'always'

  // Fetch results for post-submit display when showResults === 'after_submit'
  const submittedResultsQuery = useQuery(
    api.responses.getResults,
    submitted && showResults === 'after_submit' && question
      ? { questionId: question._id }
      : 'skip'
  )

  // Reset state when question changes
  useEffect(() => {
    setSubmitted(false)
    setTimeUp(false)
    setRemaining(null)
  }, [question?._id])

  // Countdown timer
  useEffect(() => {
    const timeLimit = question?.timeLimit && question.timeLimit > 0 ? question.timeLimit : 0
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
  }, [question?.timeLimit, questionStartedAt, question?._id])

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AudienceHeader branding={branding} />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="animate-pulse-soft">
            <Clock className="w-14 h-14 text-primary/70 mx-auto mb-5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Get ready...
          </h2>
          <p className="text-muted-foreground text-sm">Next question coming up</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (answer: string) => {
    try {
      await submitResponse({
        questionId: question._id,
        sessionId,
        participantId,
        answer,
      })
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit'
      if (message.includes('no longer active') || message.includes('Time is up')) {
        toast.error(message)
        setSubmitted(true)
      } else {
        toast.error('Failed to submit')
      }
      console.error(err)
    }
  }

  return (
    <AudienceVotingContent
      question={question}
      questionIndex={activeQuestionIndex >= 0 ? activeQuestionIndex : 0}
      onSubmit={handleSubmit}
      isSubmitted={submitted}
      remainingSeconds={remaining}
      isTimeUp={timeUp}
      submittedResults={submittedResultsQuery ?? null}
      totalQuestions={sortedQuestions.length}
      totalSeconds={question.timeLimit && question.timeLimit > 0 ? question.timeLimit : undefined}
      size="full"
      branding={branding}
    />
  )
}
