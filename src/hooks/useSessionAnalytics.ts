import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function useSessionAnalytics(sessionId: Id<'sessions'>) {
  const session = useQuery(api.sessions.get, { sessionId })
  const questions = useQuery(api.questions.listBySession, { sessionId })
  const sessionAnalytics = useQuery(api.analytics.getSessionAnalytics, { sessionId })
  const participantEngagement = useQuery(api.analytics.getParticipantEngagement, { sessionId })
  const responseTimeline = useQuery(api.analytics.getResponseTimeline, { sessionId })

  const sortedQuestions = questions
    ? [...questions].sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  const isLoading =
    session === undefined ||
    questions === undefined ||
    sessionAnalytics === undefined ||
    participantEngagement === undefined ||
    responseTimeline === undefined

  return {
    session,
    questions,
    sortedQuestions,
    sessionAnalytics,
    participantEngagement,
    responseTimeline,
    isLoading,
  }
}
