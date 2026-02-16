import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Join a session as a participant
export const join = mutation({
  args: {
    sessionId: v.id('sessions'),
    uniqueId: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check session status
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')
    if (session.status === 'ended') throw new Error('This session has ended')

    // Check participant cap
    if (session.maxParticipants && session.maxParticipants > 0) {
      // Allow re-joins (check if this device already joined)
      const existingParticipant = await ctx.db
        .query('participants')
        .withIndex('by_unique', (q) =>
          q.eq('sessionId', args.sessionId).eq('uniqueId', args.uniqueId)
        )
        .first()

      if (!existingParticipant) {
        const count = await ctx.db
          .query('participants')
          .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
          .collect()
        if (count.length >= session.maxParticipants) {
          throw new Error('Session is full')
        }
      }
    }

    // Check if already joined
    const existing = await ctx.db
      .query('participants')
      .withIndex('by_unique', (q) =>
        q.eq('sessionId', args.sessionId).eq('uniqueId', args.uniqueId)
      )
      .first()

    if (existing) {
      // Update name if provided
      if (args.name && args.name !== existing.name) {
        await ctx.db.patch(existing._id, { name: args.name })
      }
      return existing._id
    }

    return await ctx.db.insert('participants', {
      sessionId: args.sessionId,
      uniqueId: args.uniqueId,
      name: args.name,
      joinedAt: Date.now(),
    })
  },
})

// List participants for a session
export const listBySession = query({
  args: { sessionId: v.id('sessions') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('participants')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect()
  },
})

// Get participant by unique ID in a session
export const getByUniqueId = query({
  args: {
    sessionId: v.id('sessions'),
    uniqueId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('participants')
      .withIndex('by_unique', (q) =>
        q.eq('sessionId', args.sessionId).eq('uniqueId', args.uniqueId)
      )
      .first()
  },
})
