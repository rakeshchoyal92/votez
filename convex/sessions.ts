import { v } from 'convex/values'
import { mutation, query, internalMutation, action, internalAction } from './_generated/server'
import { internal } from './_generated/api'

const DELETE_BATCH_SIZE = 500

// Generate a random 6-character code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I,O,0,1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Create a new session
export const create = mutation({
  args: {
    title: v.string(),
    presenterId: v.string(),
    presenterName: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate unique code
    let code = generateCode()
    let existing = await ctx.db
      .query('sessions')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first()
    while (existing) {
      code = generateCode()
      existing = await ctx.db
        .query('sessions')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first()
    }

    const sessionId = await ctx.db.insert('sessions', {
      code,
      title: args.title,
      presenterId: args.presenterId,
      presenterName: args.presenterName,
      status: 'draft',
    })

    return { sessionId, code }
  },
})

// Get session by ID (resolves branding storage URLs)
export const get = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) return null
    const brandLogoUrl = session.brandLogoId
      ? await ctx.storage.getUrl(session.brandLogoId)
      : null
    const brandBackgroundImageUrl = session.brandBackgroundImageId
      ? await ctx.storage.getUrl(session.brandBackgroundImageId)
      : null
    return { ...session, brandLogoUrl, brandBackgroundImageUrl }
  },
})

// Get session by join code (resolves branding storage URLs)
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_code', (q) => q.eq('code', args.code.toUpperCase()))
      .first()
    if (!session) return null
    const brandLogoUrl = session.brandLogoId
      ? await ctx.storage.getUrl(session.brandLogoId)
      : null
    const brandBackgroundImageUrl = session.brandBackgroundImageId
      ? await ctx.storage.getUrl(session.brandBackgroundImageId)
      : null
    return { ...session, brandLogoUrl, brandBackgroundImageUrl }
  },
})

// List sessions for a presenter
export const listByPresenter = query({
  args: { presenterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sessions')
      .withIndex('by_presenter', (q) => q.eq('presenterId', args.presenterId))
      .order('desc')
      .collect()
  },
})

// Update session status
export const updateStatus = mutation({
  args: {
    sessionId: v.id('sessions'),
    status: v.union(v.literal('draft'), v.literal('active'), v.literal('ended')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { status: args.status })
  },
})

// Update session title
export const updateTitle = mutation({
  args: {
    sessionId: v.id('sessions'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { title: args.title })
  },
})

// Set active question (ID-based)
export const setActiveQuestion = mutation({
  args: {
    sessionId: v.id('sessions'),
    questionId: v.optional(v.id('questions')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      activeQuestionId: args.questionId,
      activeQuestionIndex: undefined, // clear legacy field
      questionStartedAt: args.questionId ? Date.now() : undefined,
    })
  },
})

// Delete a session and all related data (batched to avoid read limits)
export const remove = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    // Mark session as deleting so UI can show a loading state
    const session = await ctx.db.get(args.sessionId)
    if (!session) return

    // Start batched deletion
    await ctx.scheduler.runAfter(0, internal.sessions.deleteBatch, {
      sessionId: args.sessionId,
    })
  },
})

// Internal: delete a batch of related rows, re-schedule if more remain
export const deleteBatch = internalMutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    // Delete responses in batches
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .take(DELETE_BATCH_SIZE)
    for (const r of responses) {
      await ctx.db.delete(r._id)
    }
    if (responses.length === DELETE_BATCH_SIZE) {
      // More responses to delete — re-schedule
      await ctx.scheduler.runAfter(0, internal.sessions.deleteBatch, {
        sessionId: args.sessionId,
      })
      return
    }

    // Delete participants in batches
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .take(DELETE_BATCH_SIZE)
    for (const p of participants) {
      await ctx.db.delete(p._id)
    }
    if (participants.length === DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.sessions.deleteBatch, {
        sessionId: args.sessionId,
      })
      return
    }

    // Delete questions
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
    for (const q of questions) {
      await ctx.db.delete(q._id)
    }

    // Finally delete the session itself
    const session = await ctx.db.get(args.sessionId)
    if (session) {
      await ctx.db.delete(args.sessionId)
    }
  },
})

// Get participant count for a session
export const getParticipantCount = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
    return participants.length
  },
})

// Get stats for a session (question count, participant count, response count)
export const getStats = query({
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

    return {
      questionCount: questions.length,
      participantCount: participants.length,
      responseCount: responses.length,
    }
  },
})

// Duplicate (clone) a session with its questions
export const duplicate = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')

    // Generate unique code
    let code = generateCode()
    let existing = await ctx.db
      .query('sessions')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first()
    while (existing) {
      code = generateCode()
      existing = await ctx.db
        .query('sessions')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first()
    }

    const newSessionId = await ctx.db.insert('sessions', {
      code,
      title: `${session.title} (copy)`,
      presenterId: session.presenterId,
      presenterName: session.presenterName,
      status: 'draft',
      maxParticipants: session.maxParticipants,
      brandBgColor: session.brandBgColor,
      brandAccentColor: session.brandAccentColor,
      brandTextColor: session.brandTextColor,
      brandLogoId: session.brandLogoId,
      brandBackgroundImageId: session.brandBackgroundImageId,
    })

    // Copy questions (without responses)
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    for (const q of questions) {
      await ctx.db.insert('questions', {
        sessionId: newSessionId,
        title: q.title,
        type: q.type,
        options: q.options,
        sortOrder: q.sortOrder,
        timeLimit: q.timeLimit,
        chartLayout: q.chartLayout,
        allowMultiple: q.allowMultiple,
        correctAnswer: q.correctAnswer,
        showResults: q.showResults,
      })
    }

    return { sessionId: newSessionId, code }
  },
})

// Update max participants
export const updateMaxParticipants = mutation({
  args: {
    sessionId: v.id('sessions'),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      maxParticipants: args.maxParticipants,
    })
  },
})

// Update session branding fields
export const updateBranding = mutation({
  args: {
    sessionId: v.id('sessions'),
    brandBgColor: v.optional(v.string()),
    brandAccentColor: v.optional(v.string()),
    brandTextColor: v.optional(v.string()),
    brandLogoId: v.optional(v.string()),
    brandBackgroundImageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args
    // Only patch fields that were explicitly provided
    const patch: Record<string, string | undefined> = {}
    if (updates.brandBgColor !== undefined) patch.brandBgColor = updates.brandBgColor
    if (updates.brandAccentColor !== undefined) patch.brandAccentColor = updates.brandAccentColor
    if (updates.brandTextColor !== undefined) patch.brandTextColor = updates.brandTextColor
    if (updates.brandLogoId !== undefined) patch.brandLogoId = updates.brandLogoId
    if (updates.brandBackgroundImageId !== undefined) patch.brandBackgroundImageId = updates.brandBackgroundImageId
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(sessionId, patch)
    }
  },
})

// Clear a branding image (delete from storage + clear field)
export const clearBrandingImage = mutation({
  args: {
    sessionId: v.id('sessions'),
    field: v.union(v.literal('brandLogoId'), v.literal('brandBackgroundImageId')),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) return
    const storageId = session[args.field]
    if (storageId) {
      await ctx.storage.delete(storageId)
    }
    await ctx.db.patch(args.sessionId, { [args.field]: undefined })
  },
})

// Reset session — clear all responses + participants, keep questions
export const resetSession = mutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    // Clear active question state
    await ctx.db.patch(args.sessionId, {
      activeQuestionId: undefined,
      activeQuestionIndex: undefined,
      questionStartedAt: undefined,
    })
    // Schedule batched deletion of responses + participants
    await ctx.scheduler.runAfter(0, internal.sessions.resetBatch, {
      sessionId: args.sessionId,
    })
  },
})

// Internal: delete responses + participants in batches, re-schedule if more remain
export const resetBatch = internalMutation({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    // Delete responses in batches
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .take(DELETE_BATCH_SIZE)
    for (const r of responses) {
      await ctx.db.delete(r._id)
    }
    if (responses.length === DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.sessions.resetBatch, {
        sessionId: args.sessionId,
      })
      return
    }

    // Delete participants in batches
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .take(DELETE_BATCH_SIZE)
    for (const p of participants) {
      await ctx.db.delete(p._id)
    }
    if (participants.length === DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.sessions.resetBatch, {
        sessionId: args.sessionId,
      })
      return
    }
  },
})

// End stale active sessions (24h+)
export const endStaleSessions = internalMutation({
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const activeSessions = await ctx.db
      .query('sessions')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()

    for (const session of activeSessions) {
      if (session._creationTime < cutoff) {
        await ctx.db.patch(session._id, { status: 'ended' })
      }
    }
  },
})
