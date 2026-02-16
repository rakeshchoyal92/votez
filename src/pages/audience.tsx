import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Vote, Loader2, Check, Star, Send, Clock, Timer } from 'lucide-react'
import { getDeviceId, cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

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

  // Block joining ended sessions (show ended screen even if not joined)
  if (session.status === 'ended') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mb-5">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Session ended</h2>
        <p className="text-muted-foreground text-sm">
          {hasJoined ? 'Thanks for participating!' : 'This session is no longer accepting participants.'}
        </p>
      </div>
    )
  }

  // Join screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5">
              <Vote className="w-6 h-6 text-primary-foreground" />
            </div>
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
    )
  }

  // Waiting / Active / Ended states
  if (session.status === 'draft') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="animate-pulse-soft">
          <Clock className="w-14 h-14 text-primary/30 mx-auto mb-5" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Waiting to start...</h2>
        <p className="text-muted-foreground text-sm">The presenter hasn't started yet</p>
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
    />
  )
}

// Voter component for active question
function ActiveQuestionVoter({
  sessionId,
  participantId,
  activeQuestionId,
  questionStartedAt,
}: {
  sessionId: Id<'sessions'>
  participantId: Id<'participants'>
  activeQuestionId?: Id<'questions'>
  questionStartedAt?: number
}) {
  const questions = useQuery(api.questions.listBySession, { sessionId })
  const submitResponse = useMutation(api.responses.submit)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [openText, setOpenText] = useState('')
  const [rating, setRating] = useState(0)
  const [timeUp, setTimeUp] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)

  const sortedQuestions = questions?.sort((a, b) => a.sortOrder - b.sortOrder) ?? []
  const question = activeQuestionId
    ? sortedQuestions.find((q) => q._id === activeQuestionId) ?? null
    : null
  const activeQuestionIndex = question
    ? sortedQuestions.findIndex((q) => q._id === question._id)
    : -1

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setSubmitted(false)
    setOpenText('')
    setRating(0)
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="animate-pulse-soft">
          <Clock className="w-14 h-14 text-primary/30 mx-auto mb-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Get ready...
        </h2>
        <p className="text-muted-foreground text-sm">Next question coming up</p>
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
      setSelectedAnswer(answer)
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

  if (timeUp && !submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-18 h-18 bg-amber-500/15 rounded-full flex items-center justify-center mb-5 p-4">
          <Timer className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Time&apos;s up!</h2>
        <p className="text-muted-foreground text-sm">Waiting for next question...</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-18 h-18 bg-success/15 rounded-full flex items-center justify-center mb-5 p-4">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Submitted!</h2>
        <p className="text-muted-foreground text-sm">Waiting for next question...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <p className="text-xs text-primary font-semibold mb-3 uppercase tracking-widest">
          Question {activeQuestionIndex >= 0 ? activeQuestionIndex + 1 : 1}
        </p>
        <h2 className="text-2xl font-bold text-foreground text-center mb-4 leading-snug">
          {question.title}
        </h2>

        {remaining !== null && remaining > 0 && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Timer className={cn('w-4 h-4', remaining <= 5 ? 'text-amber-500' : 'text-muted-foreground')} />
            <span className={cn(
              'text-sm font-mono font-semibold tabular-nums',
              remaining <= 5 ? 'text-amber-500' : 'text-muted-foreground'
            )}>
              {remaining}s
            </span>
          </div>
        )}

        {remaining === null && <div className="mb-4" />}

        {/* Multiple Choice */}
        {question.type === 'multiple_choice' && question.options && (
          <div className="w-full space-y-3 stagger-children">
            {question.options.map((option, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => handleSubmit(option)}
                className={cn(
                  'w-full py-4 px-5 h-auto rounded-xl text-left justify-start font-medium text-lg border-2 transition-all',
                  selectedAnswer === option
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:border-primary/30 active:scale-[0.98]'
                )}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {/* Word Cloud */}
        {question.type === 'word_cloud' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (openText.trim()) handleSubmit(openText.trim())
            }}
            className="w-full flex gap-2"
          >
            <Input
              type="text"
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              placeholder="Type a word or phrase..."
              maxLength={50}
              autoFocus
              className="flex-1 h-12 text-lg"
            />
            <Button
              type="submit"
              disabled={!openText.trim()}
              size="lg"
              className="h-12"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        )}

        {/* Open Ended */}
        {question.type === 'open_ended' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (openText.trim()) handleSubmit(openText.trim())
            }}
            className="w-full space-y-3"
          >
            <Textarea
              value={openText}
              onChange={(e) => setOpenText(e.target.value)}
              placeholder="Type your answer..."
              rows={3}
              autoFocus
              className="text-lg resize-none"
            />
            <Button
              type="submit"
              disabled={!openText.trim()}
              className="w-full h-12"
            >
              <Send className="w-4 h-4" />
              Submit
            </Button>
          </form>
        )}

        {/* Rating */}
        {question.type === 'rating' && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="icon"
                  onClick={() => setRating(star)}
                  className="h-14 w-14 transition-transform active:scale-90"
                >
                  <Star
                    className={cn(
                      'w-12 h-12 transition-colors',
                      star <= rating
                        ? 'fill-star text-star'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </Button>
              ))}
            </div>
            {rating > 0 && (
              <Button
                size="lg"
                onClick={() => handleSubmit(String(rating))}
                className="animate-fade-in shadow-sm"
              >
                Submit Rating
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
