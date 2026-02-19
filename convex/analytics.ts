import { v } from 'convex/values'
import { query } from './_generated/server'

// Session-level analytics summary
export const getSessionAnalytics = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const [questions, participants, responses] = await Promise.all([
      ctx.db
        .query('questions')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
      ctx.db
        .query('participants')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
      ctx.db
        .query('responses')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
    ])

    const totalParticipants = participants.length
    const totalResponses = responses.length
    const totalQuestions = questions.length

    // responseRate = totalResponses / (totalParticipants * totalQuestions)
    const maxPossible = totalParticipants * totalQuestions
    const responseRate = maxPossible > 0 ? totalResponses / maxPossible : 0

    // Session duration based on response timestamps
    let firstResponseAt: number | null = null
    let lastResponseAt: number | null = null
    if (responses.length > 0) {
      const timestamps = responses.map((r) => r.answeredAt)
      firstResponseAt = Math.min(...timestamps)
      lastResponseAt = Math.max(...timestamps)
    }

    const sessionDuration =
      firstResponseAt !== null && lastResponseAt !== null
        ? lastResponseAt - firstResponseAt
        : null

    return {
      totalParticipants,
      totalResponses,
      totalQuestions,
      responseRate,
      sessionDuration,
      firstResponseAt,
      lastResponseAt,
    }
  },
})

// Per-participant engagement breakdown
export const getParticipantEngagement = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const [participants, questions, responses] = await Promise.all([
      ctx.db
        .query('participants')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
      ctx.db
        .query('questions')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
      ctx.db
        .query('responses')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
    ])

    const totalQuestions = questions.length

    // Group responses by participantId, count distinct questionIds
    const responsesByParticipant = new Map<string, Set<string>>()
    for (const r of responses) {
      const existing = responsesByParticipant.get(r.participantId)
      if (existing) {
        existing.add(r.questionId)
      } else {
        responsesByParticipant.set(r.participantId, new Set([r.questionId]))
      }
    }

    const engagement = participants.map((p) => {
      const answeredQuestions = responsesByParticipant.get(p._id)
      const questionsAnswered = answeredQuestions ? answeredQuestions.size : 0
      const engagementRate = totalQuestions > 0 ? questionsAnswered / totalQuestions : 0

      return {
        participantId: p._id,
        name: p.name || null,
        joinedAt: p.joinedAt,
        questionsAnswered,
        totalQuestions,
        engagementRate,
      }
    })

    // Sort by engagement rate descending, then by name
    engagement.sort((a, b) => b.engagementRate - a.engagementRate)

    return engagement
  },
})

// Per-question response timeline (for sparkline charts)
export const getResponseTimeline = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const [questions, responses] = await Promise.all([
      ctx.db
        .query('questions')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
      ctx.db
        .query('responses')
        .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
        .collect(),
    ])

    // Sort questions by sortOrder
    questions.sort((a, b) => a.sortOrder - b.sortOrder)

    // Group responses by question
    const responsesByQuestion = new Map<string, { answeredAt: number }[]>()
    for (const r of responses) {
      const existing = responsesByQuestion.get(r.questionId)
      const entry = { answeredAt: r.answeredAt }
      if (existing) {
        existing.push(entry)
      } else {
        responsesByQuestion.set(r.questionId, [entry])
      }
    }

    return questions.map((q) => {
      const qResponses = responsesByQuestion.get(q._id) ?? []
      // Sort by answeredAt ascending
      qResponses.sort((a, b) => a.answeredAt - b.answeredAt)

      return {
        questionId: q._id,
        questionTitle: q.title,
        responses: qResponses,
      }
    })
  },
})
