import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// List questions for a session (resolves option image URLs)
export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()

    return Promise.all(
      questions.map(async (q) => {
        const optionImageUrls = q.optionImages
          ? await Promise.all(
              q.optionImages.map((id) => (id ? ctx.storage.getUrl(id) : null))
            )
          : null
        return { ...q, optionImageUrls }
      })
    )
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
    optionImages: v.optional(v.array(v.string())),
    timeLimit: v.optional(v.number()),
    chartLayout: v.optional(v.union(v.literal('bars'), v.literal('donut'), v.literal('pie'))),
    allowMultiple: v.optional(v.boolean()),
    correctAnswer: v.optional(v.string()),
    showResults: v.optional(v.union(v.literal('always'), v.literal('after_submit'), v.literal('after_close'))),
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
      optionImages: args.optionImages,
      sortOrder,
      timeLimit: args.timeLimit,
      chartLayout: args.chartLayout,
      allowMultiple: args.allowMultiple,
      correctAnswer: args.correctAnswer,
      showResults: args.showResults,
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
    optionImages: v.optional(v.array(v.string())),
    timeLimit: v.optional(v.number()),
    chartLayout: v.optional(v.union(v.literal('bars'), v.literal('donut'), v.literal('pie'))),
    allowMultiple: v.optional(v.boolean()),
    correctAnswer: v.optional(v.string()),
    showResults: v.optional(v.union(v.literal('always'), v.literal('after_submit'), v.literal('after_close'))),
  },
  handler: async (ctx, args) => {
    const { questionId, ...updates } = args
    const question = await ctx.db.get(questionId)
    if (!question) throw new Error('Question not found')
    const session = await ctx.db.get(question.sessionId)
    if (!session || session.status === 'ended') {
      throw new Error('Cannot modify questions — session has ended')
    }

    const isMC = (updates.type ?? question.type) === 'multiple_choice'

    // When live, allow safe edits: title, options text/add, correctAnswer, showResults, timeLimit, chartLayout
    // Blocked: type change, allowMultiple toggle
    if (session.status === 'active') {
      if (updates.type !== undefined && updates.type !== question.type) {
        throw new Error('Cannot change question type while session is live')
      }
      await ctx.db.patch(questionId, {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.showResults !== undefined && { showResults: updates.showResults }),
        ...(updates.timeLimit !== undefined && { timeLimit: updates.timeLimit > 0 ? updates.timeLimit : undefined }),
        ...(isMC && updates.correctAnswer !== undefined && { correctAnswer: updates.correctAnswer }),
        ...(isMC && updates.chartLayout !== undefined && { chartLayout: updates.chartLayout }),
        ...(isMC && updates.options !== undefined && { options: updates.options }),
        ...(isMC && updates.optionImages !== undefined && { optionImages: updates.optionImages }),
      })
      return
    }

    // Draft mode: full editing
    await ctx.db.patch(questionId, {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.showResults !== undefined && { showResults: updates.showResults }),
      ...(updates.timeLimit !== undefined && { timeLimit: updates.timeLimit > 0 ? updates.timeLimit : undefined }),
      // MC-specific fields: save when MC, clear when not
      options: isMC ? (updates.options ?? question.options) : undefined,
      optionImages: isMC ? (updates.optionImages ?? question.optionImages) : undefined,
      chartLayout: isMC ? (updates.chartLayout ?? question.chartLayout) : undefined,
      allowMultiple: isMC ? (updates.allowMultiple ?? question.allowMultiple) : undefined,
      correctAnswer: isMC ? (updates.correctAnswer ?? question.correctAnswer) : undefined,
    })
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
