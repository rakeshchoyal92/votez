import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Polling sessions created by presenters
  sessions: defineTable({
    code: v.string(), // 6-char join code
    title: v.string(),
    presenterId: v.string(), // Supabase auth uid
    presenterName: v.string(),
    status: v.union(v.literal('draft'), v.literal('active'), v.literal('ended')),
    activeQuestionIndex: v.optional(v.number()), // deprecated, kept for compat
    activeQuestionId: v.optional(v.id('questions')),
    questionStartedAt: v.optional(v.number()), // timestamp when current question was activated
    maxParticipants: v.optional(v.number()), // 0 or undefined = unlimited
    // Branding
    brandBgColor: v.optional(v.string()),
    brandAccentColor: v.optional(v.string()),
    brandTextColor: v.optional(v.string()),
    brandLogoId: v.optional(v.string()),             // Convex storage ID
    brandBackgroundImageId: v.optional(v.string()),   // Convex storage ID
    isQuizMode: v.optional(v.boolean()),               // Enable quiz scoring + leaderboard
  })
    .index('by_code', ['code'])
    .index('by_presenter', ['presenterId'])
    .index('by_status', ['status']),

  // Questions within a session
  questions: defineTable({
    sessionId: v.id('sessions'),
    title: v.string(),
    type: v.union(
      v.literal('multiple_choice'),
      v.literal('word_cloud'),
      v.literal('open_ended'),
      v.literal('rating')
    ),
    options: v.optional(v.array(v.string())), // For multiple_choice
    optionImages: v.optional(v.array(v.string())), // Convex storage IDs, parallel to options[]
    sortOrder: v.number(),
    timeLimit: v.optional(v.number()), // seconds, 0 = no limit
    chartLayout: v.optional(v.union(v.literal('bars'), v.literal('donut'), v.literal('pie'))),
    allowMultiple: v.optional(v.boolean()), // MC multi-select
    correctAnswer: v.optional(v.string()), // correct option text (for MC)
    showResults: v.optional(v.union(
      v.literal('always'),        // show live during voting
      v.literal('after_submit'),  // show after participant submits
      v.literal('after_close')    // only show when presenter moves on
    )),
  }).index('by_session', ['sessionId', 'sortOrder']),

  // Audience participants
  participants: defineTable({
    sessionId: v.id('sessions'),
    uniqueId: v.string(), // browser fingerprint or random id
    name: v.optional(v.string()),
    joinedAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_unique', ['sessionId', 'uniqueId']),

  // Responses (votes/answers)
  responses: defineTable({
    questionId: v.id('questions'),
    sessionId: v.id('sessions'),
    participantId: v.id('participants'),
    answer: v.string(), // option text, word, open text, or rating number
    answeredAt: v.number(),
    questionStartedAt: v.optional(v.number()), // snapshot for quiz scoring
  })
    .index('by_question', ['questionId'])
    .index('by_question_participant', ['questionId', 'participantId'])
    .index('by_session', ['sessionId']),
})
