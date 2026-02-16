import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// List questions for a session
export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
  },
})

// Get a single question
export const get = query({
  args: { questionId: v.id('questions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId)
  },
})

// Create a question
export const create = mutation({
  args: {
    sessionId: v.id('sessions'),
    title: v.string(),
    type: v.union(
      v.literal('multiple_choice'),
      v.literal('word_cloud'),
      v.literal('open_ended'),
      v.literal('rating')
    ),
    options: v.optional(v.array(v.string())),
    timeLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (session?.status !== 'draft') {
      throw new Error('Cannot modify questions — session is not in draft')
    }

    // Get next sort order
    const existing = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
    const sortOrder = existing.length

    return await ctx.db.insert('questions', {
      sessionId: args.sessionId,
      title: args.title,
      type: args.type,
      options: args.options,
      sortOrder,
      timeLimit: args.timeLimit,
    })
  },
})

// Update a question
export const update = mutation({
  args: {
    questionId: v.id('questions'),
    title: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('multiple_choice'),
        v.literal('word_cloud'),
        v.literal('open_ended'),
        v.literal('rating')
      )
    ),
    options: v.optional(v.array(v.string())),
    timeLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { questionId, ...updates } = args
    const question = await ctx.db.get(questionId)
    if (!question) throw new Error('Question not found')
    const session = await ctx.db.get(question.sessionId)
    if (session?.status !== 'draft') {
      throw new Error('Cannot modify questions — session is not in draft')
    }

    const cleanUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.type !== undefined) cleanUpdates.type = updates.type
    if (updates.options !== undefined) cleanUpdates.options = updates.options
    if (updates.timeLimit !== undefined) cleanUpdates.timeLimit = updates.timeLimit

    await ctx.db.patch(questionId, cleanUpdates)
  },
})

// Delete a question and its responses
export const remove = mutation({
  args: { questionId: v.id('questions') },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId)
    if (!question) throw new Error('Question not found')
    const session = await ctx.db.get(question.sessionId)
    if (session?.status !== 'draft') {
      throw new Error('Cannot modify questions — session is not in draft')
    }

    // Delete responses for this question
    const responses = await ctx.db
      .query('responses')
      .withIndex('by_question', (q) => q.eq('questionId', args.questionId))
      .collect()
    for (const r of responses) {
      await ctx.db.delete(r._id)
    }

    await ctx.db.delete(args.questionId)
  },
})

// Reorder questions
export const reorder = mutation({
  args: {
    sessionId: v.id('sessions'),
    questionIds: v.array(v.id('questions')),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId)
    if (session?.status !== 'draft') {
      throw new Error('Cannot modify questions — session is not in draft')
    }

    for (let i = 0; i < args.questionIds.length; i++) {
      await ctx.db.patch(args.questionIds[i], { sortOrder: i })
    }
  },
})
