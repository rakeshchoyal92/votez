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
        questionStartedAt: session.questionStartedAt,
      })
      return existing._id
    }

    return await ctx.db.insert('responses', {
      questionId: args.questionId,
      sessionId: args.sessionId,
      participantId: args.participantId,
      answer: args.answer,
      answeredAt: Date.now(),
      questionStartedAt: session.questionStartedAt,
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

// Convex field names must be printable ASCII (0x20-0x7E).
// User-typed answers can contain em dashes, smart quotes, accented chars, emojis, etc.
// Sanitize so the counts record serializes safely.
function safeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics: é → e
    .replace(/[\u2014]/g, '--')      // em dash → --
    .replace(/[\u2013]/g, '-')       // en dash → -
    .replace(/[\u2018\u2019]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // smart double quotes
    .replace(/[\u2026]/g, '...')     // ellipsis
    .replace(/[^\x20-\x7E]/g, '')    // strip remaining non-ASCII
}

// Get aggregated results for a question (counts per option)
export const getResults = query({
  args: { questionId: v.id('questions') },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId)
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_question', (q) => q.eq('questionId', args.questionId))
      .collect()

    // Aggregate counts — split comma-separated answers for multi-select
    const counts: Record<string, number> = {}
    const isMultiSelect = question?.allowMultiple === true
    for (const r of responses) {
      if (isMultiSelect && r.answer.includes(',')) {
        for (const part of r.answer.split(',')) {
          const trimmed = part.trim()
          if (trimmed) counts[safeKey(trimmed)] = (counts[safeKey(trimmed)] || 0) + 1
        }
      } else {
        counts[safeKey(r.answer)] = (counts[safeKey(r.answer)] || 0) + 1
      }
    }

    return {
      totalResponses: responses.length,
      counts,
    }
  },
})

// Reset (delete) all responses for a question
export const resetResults = mutation({
  args: { questionId: v.id('questions') },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_question', (q) => q.eq('questionId', args.questionId))
      .collect()
    for (const r of responses) {
      await ctx.db.delete(r._id)
    }
    return responses.length
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

// ═══════════════════════════════════════════════════════════
//  Quiz mode: leaderboard + participant score
// ═══════════════════════════════════════════════════════════

function computeQuizScore(
  answeredAt: number,
  questionStartedAt: number | undefined,
  timeLimit: number | undefined
): number {
  const BASE = 1000
  const MAX_BONUS = 500
  if (!questionStartedAt || !timeLimit || timeLimit <= 0) return BASE
  const elapsed = (answeredAt - questionStartedAt) / 1000
  const fraction = Math.min(1, Math.max(0, elapsed / timeLimit))
  return Math.round(BASE + MAX_BONUS * (1 - fraction))
}

// Get leaderboard for a session (quiz mode)
export const getLeaderboard = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    const responses = await ctx.db
      .query('responses')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    const participants = await ctx.db
      .query('participants')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    // Build lookup: questionId → question
    const questionMap = new Map(questions.map((q) => [q._id, q]))

    // Aggregate scores per participant
    const scores: Record<string, number> = {}
    for (const r of responses) {
      const question = questionMap.get(r.questionId)
      if (!question || question.type !== 'multiple_choice' || !question.correctAnswer) continue
      if (r.answer !== question.correctAnswer) continue

      const pts = computeQuizScore(r.answeredAt, r.questionStartedAt, question.timeLimit)
      scores[r.participantId] = (scores[r.participantId] || 0) + pts
    }

    // Build ranked list
    const participantMap = new Map(participants.map((p) => [p._id, p]))
    const entries = participants.map((p) => ({
      participantId: p._id,
      name: p.name || 'Anonymous',
      score: scores[p._id] || 0,
      rank: 0,
    }))
    entries.sort((a, b) => b.score - a.score)
    entries.forEach((e, i) => { e.rank = i + 1 })

    return entries
  },
})

// Get a single participant's score + rank (quiz mode)
export const getParticipantScore = query({
  args: {
    sessionId: v.id('sessions'),
    participantId: v.id('participants'),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    const responses = await ctx.db
      .query('responses')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    const participants = await ctx.db
      .query('participants')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    const questionMap = new Map(questions.map((q) => [q._id, q]))

    // Compute all scores
    const scores: Record<string, number> = {}
    const lastCorrect: Record<string, { isCorrect: boolean; correctAnswer?: string; points: number }> = {}
    for (const r of responses) {
      const question = questionMap.get(r.questionId)
      if (!question || question.type !== 'multiple_choice' || !question.correctAnswer) continue
      const isCorrect = r.answer === question.correctAnswer
      if (isCorrect) {
        const pts = computeQuizScore(r.answeredAt, r.questionStartedAt, question.timeLimit)
        scores[r.participantId] = (scores[r.participantId] || 0) + pts
      }
      // Track last answer for the requested participant
      if (r.participantId === args.participantId) {
        lastCorrect[r.questionId] = {
          isCorrect,
          correctAnswer: question.correctAnswer,
          points: isCorrect ? computeQuizScore(r.answeredAt, r.questionStartedAt, question.timeLimit) : 0,
        }
      }
    }

    // Rank
    const ranked = participants
      .map((p) => ({ id: p._id, score: scores[p._id] || 0 }))
      .sort((a, b) => b.score - a.score)
    const rank = ranked.findIndex((e) => e.id === args.participantId) + 1

    return {
      score: scores[args.participantId] || 0,
      rank,
      totalParticipants: participants.length,
      lastCorrect,
    }
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
