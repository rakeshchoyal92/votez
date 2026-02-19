import { v } from 'convex/values'
import { mutation } from './_generated/server'

// ─── Answer generation helpers ───────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function multiPick(options: string[], weights: number[]): string {
  const count = weightedPick([1, 2, 3], [35, 45, 20])
  const scored = options.map((opt, i) => ({
    opt,
    score: weights[i] * (0.5 + Math.random()),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored
    .slice(0, Math.min(count, options.length))
    .map((s) => s.opt)
    .join(', ')
}

function ratingWithBias(center: number, spread: number): string {
  const r = center + (Math.random() - 0.5) * spread * 2
  return String(Math.max(1, Math.min(5, Math.round(r))))
}

// ─── Word/phrase pools ───────────────────────────────────

const WORD_POOL = [
  'collaborative', 'innovative', 'creative', 'inspiring', 'productive',
  'engaging', 'exciting', 'thoughtful', 'dynamic', 'focused',
  'supportive', 'empowering', 'ambitious', 'resilient', 'passionate',
  'energetic', 'inclusive', 'transparent', 'agile', 'friendly',
  'brilliant', 'modern', 'elegant', 'powerful', 'intuitive',
  'fast', 'smooth', 'clean', 'solid', 'fresh',
]
const WORD_WEIGHTS = [
  20, 15, 12, 10, 14, 9, 8, 7, 11, 13,
  8, 6, 5, 7, 4, 3, 9, 6, 5, 8,
  4, 5, 3, 7, 10, 8, 6, 9, 4, 3,
]

const PHRASE_POOL = [
  'Great session, really enjoyed the format!',
  'I think we should do this more often',
  'Love the interactive approach to gathering feedback',
  'Some questions could have more options to choose from',
  'The real-time results are really engaging',
  'Would be great to have more open discussion time',
  'Really appreciate the anonymous voting option',
  'This is much better than our old survey tool',
  'The visual presentation of results is excellent',
  'Looking forward to seeing how this feedback is used',
  'Clear and concise questions, easy to answer',
  'Would love to see follow-up results shared later',
  'The pace was perfect, not too rushed',
  'Great way to hear everyone\'s perspective',
  'Enjoyed participating, hope to see action on the results',
]

// ─── Name generation ─────────────────────────────────────

const FIRST_NAMES = [
  'Aisha', 'Arjun', 'Bella', 'Carlos', 'Deepa', 'Elena', 'Felix', 'Grace',
  'Hugo', 'Iris', 'James', 'Kavya', 'Leo', 'Mia', 'Noah', 'Olivia',
  'Priya', 'Quinn', 'Raj', 'Sofia', 'Tariq', 'Uma', 'Victor', 'Wendy',
  'Xander', 'Yara', 'Zara', 'Aiden', 'Chloe', 'Daniel', 'Eva', 'Finn',
  'Gina', 'Hana', 'Ian', 'Julia', 'Kyle', 'Luna', 'Marcus', 'Nina',
  'Omar', 'Piper', 'Ravi', 'Sara', 'Theo', 'Vera', 'Will', 'Zoe',
  'Ananya', 'Ben', 'Clara', 'Dev', 'Ella', 'Farhan', 'Gemma', 'Hassan',
  'Isla', 'Jay', 'Kira', 'Liam', 'Maya', 'Nadia', 'Oscar', 'Pia',
  'Rohan', 'Suki', 'Tomas', 'Ursula', 'Vikram', 'Wren', 'Yuki', 'Zain',
  'Amara', 'Blake', 'Chiara', 'Dante', 'Emi', 'Freya', 'Gio', 'Harlow',
  'Ines', 'Jasper', 'Kaia', 'Lucian', 'Maren', 'Nico', 'Opal', 'Pax',
  'Remy', 'Sienna', 'Tate', 'Ulani', 'Vale', 'Winter', 'Xiomara', 'Yael',
]

const LAST_INITIALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// ─── Generate answer based on question type ──────────────

function generateAnswer(question: {
  type: string
  options?: string[]
  allowMultiple?: boolean
  correctAnswer?: string
}): string {
  switch (question.type) {
    case 'multiple_choice': {
      const options = question.options ?? []
      if (options.length === 0) return ''
      // Bias weights toward correct answer (~65% correct) when it exists
      const weights = options.map((opt) => {
        if (question.correctAnswer && opt === question.correctAnswer) {
          return 50 + Math.floor(Math.random() * 20) // heavy weight for correct
        }
        return 10 + Math.floor(Math.random() * 15) // lighter weight for others
      })
      if (question.allowMultiple) {
        return multiPick(options, weights)
      }
      return weightedPick(options, weights)
    }
    case 'word_cloud':
      return weightedPick(WORD_POOL, WORD_WEIGHTS)
    case 'open_ended':
      return pick(PHRASE_POOL)
    case 'rating':
      return ratingWithBias(3.8, 1.0)
    default:
      return ''
  }
}

// ═══════════════════════════════════════════════════════════
//  Seed mutation
// ═══════════════════════════════════════════════════════════

export const seedResponses = mutation({
  args: {
    sessionId: v.id('sessions'),
    participantCount: v.number(),
  },
  handler: async (ctx, args) => {
    const { sessionId, participantCount } = args

    // Validate
    if (participantCount < 1 || participantCount > 200) {
      throw new Error('Participant count must be between 1 and 200')
    }

    const session = await ctx.db.get(sessionId)
    if (!session) throw new Error('Session not found')

    // Get all questions for this session
    const questions = await ctx.db
      .query('questions')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect()

    if (questions.length === 0) {
      throw new Error('Session has no questions — add at least one before simulating')
    }

    const timestamp = Date.now()
    let participantsCreated = 0
    let responsesCreated = 0

    // Create participants
    const participantIds = []
    for (let i = 0; i < participantCount; i++) {
      const nameIdx = i % FIRST_NAMES.length
      const lastIdx = i % LAST_INITIALS.length
      const name = `${FIRST_NAMES[nameIdx]} ${LAST_INITIALS[lastIdx]}.`
      const uniqueId = `sim-${sessionId}-${timestamp}-${i}`

      const id = await ctx.db.insert('participants', {
        sessionId,
        uniqueId,
        name,
        joinedAt: timestamp - Math.floor(Math.random() * 60000), // stagger join times
      })
      participantIds.push(id)
      participantsCreated++
    }

    // For each question, generate a response per participant
    for (const question of questions) {
      const questionStart = timestamp - 60000 // simulate question started 60s ago
      for (const participantId of participantIds) {
        const answer = generateAnswer(question)
        if (!answer) continue

        await ctx.db.insert('responses', {
          questionId: question._id,
          sessionId,
          participantId,
          answer,
          answeredAt: timestamp - Math.floor(Math.random() * 30000),
          questionStartedAt: questionStart,
        })
        responsesCreated++
      }
    }

    return { participantsCreated, responsesCreated }
  },
})
