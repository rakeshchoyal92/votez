import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Submit a response (vote/answer)
export const submit = mutation({
  args: {
    questionId: v.id('questions'),
    sessionId: v.id('sessions'),
    participantId: v.id('participants'),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate session and question are active
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')
    if (session.status !== 'active') throw new Error('Session is not active')
    if (session.activeQuestionId !== args.questionId) {
      throw new Error('This question is no longer active')
    }

    // Enforce time limit if set
    const question = await ctx.db.get(args.questionId)
    if (question?.timeLimit && question.timeLimit > 0 && session.questionStartedAt) {
      const elapsed = (Date.now() - session.questionStartedAt) / 1000
      if (elapsed > question.timeLimit) {
        throw new Error('Time is up for this question')
      }
    }

    // Check if already responded
    const existing = await ctx.db
      .query('responses')
      .withIndex('by_question_participant', (q) =>
        q.eq('questionId', args.questionId).eq('participantId', args.participantId)
      )
      .first()

    if (existing) {
      // Update existing response
      await ctx.db.patch(existing._id, {
        answer: args.answer,
        answeredAt: Date.now(),
      })
      return existing._id
    }

    return await ctx.db.insert('responses', {
      questionId: args.questionId,
      sessionId: args.sessionId,
      participantId: args.participantId,
      answer: args.answer,
      answeredAt: Date.now(),
    })
  },
})

// Get all responses for a question (for presenter results view)
export const listByQuestion = query({
  args: { questionId: v.id('questions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('responses')
      .withIndex('by_question', (q) => q.eq('questionId', args.questionId))
      .collect()
  },
})

// Get aggregated results for a question (counts per option)
export const getResults = query({
  args: { questionId: v.id('questions') },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_question', (q) => q.eq('questionId', args.questionId))
      .collect()

    // Aggregate counts
    const counts: Record<string, number> = {}
    for (const r of responses) {
      counts[r.answer] = (counts[r.answer] || 0) + 1
    }

    return {
      totalResponses: responses.length,
      counts,
    }
  },
})

// Check if a participant has already responded to a question
export const hasResponded = query({
  args: {
    questionId: v.id('questions'),
    participantId: v.id('participants'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('responses')
      .withIndex('by_question_participant', (q) =>
        q.eq('questionId', args.questionId).eq('participantId', args.participantId)
      )
      .first()
    return !!existing
  },
})

// Get response counts per question for a session
export const getResponseCountsBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
    const counts: Record<string, number> = {}
    for (const r of responses) {
      counts[r.questionId] = (counts[r.questionId] || 0) + 1
    }
    return counts
  },
})

// Get response count for a session
export const getSessionResponseCount = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
    return responses.length
  },
})
