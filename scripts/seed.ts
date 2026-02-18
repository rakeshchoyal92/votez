/**
 * Votez Seed Script
 *
 * Creates 3 demo sessions with realistic data:
 *   1. "All-Hands Q4 Retrospective"  — ended, 80 participants, 8 questions fully answered
 *   2. "Product Launch — Votez 2.0"  — live,  100 participants, 6/8 questions answered
 *   3. "Annual Planning Workshop"    — draft, 8 questions, no participants
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   VOTEZ_EMAIL=x VOTEZ_PASSWORD=y npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import type { Id } from "../convex/_generated/dataModel.js";
import * as readline from "node:readline";

// ─── Config ───────────────────────────────────────────────

const CONVEX_URL = "https://bold-starfish-650.convex.cloud";
const SUPABASE_URL = "https://svaxyhjoanqvadottcda.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXh5aGpvYW5xdmFkb3R0Y2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzOTIzNDIsImV4cCI6MjA1Njk2ODM0Mn0.N_2euKBDfoJiXPCYnWau7wD9b-t7tGmMx8cFNfmUy48";

const BATCH_SIZE = 30;

// ─── Helpers ──────────────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function multiPick(options: string[], weights: number[]): string {
  const count = weightedPick([1, 2, 3], [35, 45, 20]);
  const scored = options.map((opt, i) => ({
    opt,
    score: weights[i] * (0.5 + Math.random()),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, Math.min(count, options.length))
    .map((s) => s.opt)
    .join(", ");
}

function ratingWithBias(center: number, spread: number): string {
  const r = center + (Math.random() - 0.5) * spread * 2;
  return String(Math.max(1, Math.min(5, Math.round(r))));
}

// ─── Names ────────────────────────────────────────────────

const FIRST_NAMES = [
  "Aisha", "Arjun", "Bella", "Carlos", "Deepa", "Elena", "Felix", "Grace",
  "Hugo", "Iris", "James", "Kavya", "Leo", "Mia", "Noah", "Olivia",
  "Priya", "Quinn", "Raj", "Sofia", "Tariq", "Uma", "Victor", "Wendy",
  "Xander", "Yara", "Zara", "Aiden", "Chloe", "Daniel", "Eva", "Finn",
  "Gina", "Hana", "Ian", "Julia", "Kyle", "Luna", "Marcus", "Nina",
  "Omar", "Piper", "Ravi", "Sara", "Theo", "Vera", "Will", "Zoe",
  "Ananya", "Ben", "Clara", "Dev", "Ella", "Farhan", "Gemma", "Hassan",
  "Isla", "Jay", "Kira", "Liam", "Maya", "Nadia", "Oscar", "Pia",
  "Rohan", "Suki", "Tomas", "Ursula", "Vikram", "Wren", "Yuki", "Zain",
  "Amara", "Blake", "Chiara", "Dante", "Emi", "Freya", "Gio", "Harlow",
  "Ines", "Jasper", "Kaia", "Lucian", "Maren", "Nico", "Opal", "Pax",
  "Remy", "Sienna", "Tate", "Ulani", "Vale", "Winter", "Xiomara", "Yael",
];

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastInit = LAST_INITIALS[index % LAST_INITIALS.length];
  return `${first} ${lastInit}.`;
}

// ─── Logging ──────────────────────────────────────────────

function log(msg: string) {
  console.log(`\x1b[36m▸\x1b[0m ${msg}`);
}
function logOk(msg: string) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}
function logSection(msg: string) {
  console.log(`\n\x1b[1m${msg}\x1b[0m`);
}
function bar(current: number, total: number, width = 30): string {
  const pct = total > 0 ? current / total : 1;
  const filled = Math.round(width * pct);
  return `  ${"█".repeat(filled)}${"░".repeat(width - filled)} ${current}/${total}`;
}

// ─── Auth ─────────────────────────────────────────────────

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    if (hidden) {
      process.stdout.write(question);
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      if (stdin.isTTY) stdin.setRawMode(true);
      let input = "";
      const onData = (char: Buffer) => {
        const c = char.toString("utf8");
        if (c === "\n" || c === "\r") {
          if (stdin.isTTY) stdin.setRawMode(wasRaw ?? false);
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (c === "\u0003") {
          process.exit(1);
        } else if (c === "\u007F" || c === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          input += c;
          process.stdout.write("*");
        }
      };
      stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function authenticate(): Promise<{ id: string; name: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let email = process.env.VOTEZ_EMAIL || "";
  let password = process.env.VOTEZ_PASSWORD || "";
  if (!email) email = await prompt("  Email: ");
  if (!password) password = await prompt("  Password: ", true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed: ${error.message}`);
  const user = data.user;
  return { id: user.id, name: user.user_metadata?.full_name ?? user.email ?? "Presenter" };
}

// ─── Batch runner ─────────────────────────────────────────

async function batchRun<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    onProgress?.(results.length, items.length);
  }
  return results;
}

// ═══════════════════════════════════════════════════════════
//  Question Definitions
// ═══════════════════════════════════════════════════════════

interface QuestionDef {
  title: string;
  type: "multiple_choice" | "word_cloud" | "open_ended" | "rating";
  options?: string[];
  timeLimit?: number;
  chartLayout?: "bars" | "donut" | "pie";
  allowMultiple?: boolean;
  correctAnswer?: string;
  showResults?: "always" | "after_submit" | "after_close";
  generateAnswer: () => string;
}

// ─── Session 1: Retrospective (ended, 80 users) ──────────

const RETRO_QUESTIONS: QuestionDef[] = [
  {
    title: "What was the biggest win for our team this quarter?",
    type: "multiple_choice",
    options: [
      "Shipped the v2.0 release on time",
      "Reduced bug backlog by 60%",
      "Onboarded 3 new team members smoothly",
      "Hit 99.9% uptime target",
    ],
    correctAnswer: "Shipped the v2.0 release on time",
    chartLayout: "bars",
    timeLimit: 30,
    showResults: "always",
    generateAnswer: () =>
      weightedPick(
        [
          "Shipped the v2.0 release on time",
          "Reduced bug backlog by 60%",
          "Onboarded 3 new team members smoothly",
          "Hit 99.9% uptime target",
        ],
        [40, 25, 15, 20],
      ),
  },
  {
    title: "Describe our team culture in one word",
    type: "word_cloud",
    showResults: "always",
    generateAnswer: () =>
      weightedPick(
        [
          "collaborative", "supportive", "innovative", "fast-paced", "transparent",
          "fun", "driven", "inclusive", "creative", "focused",
          "empowering", "agile", "friendly", "ambitious", "resilient",
          "open", "energetic", "caring", "dynamic", "passionate",
        ],
        [20, 18, 15, 12, 14, 10, 8, 9, 7, 11, 6, 5, 8, 4, 6, 7, 3, 5, 4, 3],
      ),
  },
  {
    title: "Which process improvements helped the most? (select all that apply)",
    type: "multiple_choice",
    options: [
      "Async standups replaced daily meetings",
      "Bi-weekly retrospectives",
      "Pair programming sessions",
      "Automated CI/CD pipeline",
      "Design review checklist",
    ],
    allowMultiple: true,
    chartLayout: "donut",
    showResults: "after_submit",
    generateAnswer: () =>
      multiPick(
        [
          "Async standups replaced daily meetings",
          "Bi-weekly retrospectives",
          "Pair programming sessions",
          "Automated CI/CD pipeline",
          "Design review checklist",
        ],
        [30, 20, 15, 25, 10],
      ),
  },
  {
    title: "What's one thing you'd change about our workflow?",
    type: "open_ended",
    timeLimit: 60,
    showResults: "after_close",
    generateAnswer: () =>
      pick([
        "More time between sprints for cleanup and learning",
        "Fewer context switches between projects",
        "Better documentation for onboarding new developers",
        "Dedicated time for tech debt every sprint",
        "Clearer ownership boundaries between teams",
        "More async communication, fewer meetings",
        "Regular knowledge-sharing sessions across teams",
        "Better tooling for local development setup",
        "Faster code review turnaround",
        "More flexibility in choosing tech stack for new projects",
        "Quarterly hackathon or innovation days",
        "Streamlined deployment process",
        "Better integration between design and engineering workflows",
        "More 1:1 time with team leads",
        "Cross-team collaboration on shared components",
      ]),
  },
  {
    title: "How would you rate team communication this quarter?",
    type: "rating",
    showResults: "after_submit",
    generateAnswer: () => ratingWithBias(4.2, 0.8),
  },
  {
    title: "What should be our top priority next quarter?",
    type: "multiple_choice",
    options: [
      "Performance optimization",
      "New feature development",
      "Technical debt reduction",
      "Developer experience & tooling",
    ],
    chartLayout: "pie",
    showResults: "after_close",
    generateAnswer: () =>
      weightedPick(
        [
          "Performance optimization",
          "New feature development",
          "Technical debt reduction",
          "Developer experience & tooling",
        ],
        [22, 35, 20, 23],
      ),
  },
  {
    title: "Describe our biggest challenge in one word",
    type: "word_cloud",
    timeLimit: 20,
    showResults: "always",
    generateAnswer: () =>
      weightedPick(
        [
          "scaling", "hiring", "deadlines", "communication", "complexity",
          "burnout", "priorities", "testing", "alignment", "speed",
          "documentation", "onboarding", "scope-creep", "tech-debt", "focus",
        ],
        [20, 15, 14, 12, 10, 8, 9, 7, 6, 11, 5, 4, 8, 7, 6],
      ),
  },
  {
    title: "Shoutouts — who went above and beyond this quarter?",
    type: "open_ended",
    showResults: "always",
    generateAnswer: () =>
      pick([
        "Huge shoutout to the DevOps team for zero-downtime deploys!",
        "Elena and Raj for mentoring the new joiners so patiently",
        "The QA team caught so many edge cases before release",
        "Marcus for staying late to fix the production incident",
        "Priya's design system work saved everyone so much time",
        "The entire backend team for the database migration",
        "Theo for writing the best PRs with amazing descriptions",
        "Kavya for organizing all the team socials",
        "Hugo for the performance profiling that found the bottleneck",
        "Sara and Leo for the excellent customer feedback synthesis",
        "Everyone who contributed to the hackathon projects!",
        "The frontend team for the accessibility improvements",
        "Nina for championing better documentation practices",
        "Finn and Omar for the load testing framework",
        "The whole team honestly — what a quarter!",
      ]),
  },
];

// ─── Session 2: Product Launch (active, 100 users) ────────

const LAUNCH_QUESTIONS: QuestionDef[] = [
  {
    title: "How did you first hear about Votez?",
    type: "multiple_choice",
    options: [
      "Social media (Twitter/LinkedIn)",
      "Recommended by a colleague",
      "Blog post or article",
      "Conference or meetup",
      "Search engine",
    ],
    chartLayout: "bars",
    showResults: "always",
    generateAnswer: () =>
      weightedPick(
        [
          "Social media (Twitter/LinkedIn)",
          "Recommended by a colleague",
          "Blog post or article",
          "Conference or meetup",
          "Search engine",
        ],
        [25, 30, 15, 10, 20],
      ),
  },
  {
    title: "How easy was it to create your first polling session?",
    type: "rating",
    showResults: "always",
    generateAnswer: () => ratingWithBias(4.5, 0.6),
  },
  {
    title: "Which features do you use the most? (select all that apply)",
    type: "multiple_choice",
    options: [
      "Live multiple choice polls",
      "Word clouds",
      "Open-ended Q&A",
      "Rating scales",
      "Live results & charts",
    ],
    allowMultiple: true,
    chartLayout: "donut",
    showResults: "always",
    generateAnswer: () =>
      multiPick(
        [
          "Live multiple choice polls",
          "Word clouds",
          "Open-ended Q&A",
          "Rating scales",
          "Live results & charts",
        ],
        [35, 25, 15, 10, 15],
      ),
  },
  {
    title: "Describe Votez in one word",
    type: "word_cloud",
    showResults: "always",
    generateAnswer: () =>
      weightedPick(
        [
          "intuitive", "fast", "beautiful", "simple", "powerful",
          "clean", "smooth", "elegant", "fun", "useful",
          "engaging", "modern", "slick", "responsive", "brilliant",
          "interactive", "awesome", "delightful", "fresh", "solid",
        ],
        [18, 16, 12, 20, 14, 8, 10, 6, 9, 11, 7, 5, 4, 8, 3, 6, 5, 4, 3, 2],
      ),
  },
  {
    title: "What feature would you most like to see added to Votez?",
    type: "open_ended",
    timeLimit: 90,
    showResults: "after_submit",
    generateAnswer: () =>
      pick([
        "Export results to PDF or CSV for sharing with stakeholders",
        "Team workspace so multiple presenters can collaborate",
        "Custom branding with our company logo and colors",
        "Timer countdown visible on the audience screen",
        "Anonymous vs named voting toggle per question",
        "Integration with Slack to share results instantly",
        "Recurring sessions — clone and schedule weekly",
        "Multi-language support for international teams",
        "Emoji reactions during the live session",
        "Presenter notes visible only to the host",
        "Question bank to reuse across sessions",
        "AI-powered summary of open-ended responses",
        "Webhooks to integrate with our internal tools",
        "Offline mode for venues with spotty WiFi",
        "Screen sharing integration for Zoom and Teams",
      ]),
  },
  {
    title: "How likely are you to recommend Votez to a colleague?",
    type: "multiple_choice",
    options: [
      "Definitely would recommend",
      "Probably would recommend",
      "Maybe — need more time",
      "Unlikely to recommend",
    ],
    chartLayout: "bars",
    showResults: "after_submit",
    generateAnswer: () =>
      weightedPick(
        [
          "Definitely would recommend",
          "Probably would recommend",
          "Maybe — need more time",
          "Unlikely to recommend",
        ],
        [45, 30, 20, 5],
      ),
  },
  {
    title: "Rate the overall visual design and user experience",
    type: "rating",
    timeLimit: 15,
    showResults: "after_close",
    generateAnswer: () => ratingWithBias(4.0, 1.0),
  },
  {
    title: "Any other feedback, ideas, or suggestions?",
    type: "open_ended",
    showResults: "always",
    generateAnswer: () =>
      pick([
        "Love the product! Clean UI and super responsive",
        "The real-time updates are incredibly smooth",
        "Would be great to have dark mode for the audience view too",
        "Used it for our team standup and everyone loved it",
        "The word cloud animations are gorgeous",
        "Please add a way to moderate open-ended responses",
        "Pricing page could be clearer about what's included",
        "The QR code join flow is seamless",
        "Consider adding a free tier for small teams",
        "Would love to see analytics on engagement over time",
        "Great alternative to the clunky tools we used before",
        "The session editor is super intuitive",
        "Mobile experience on audience side is excellent",
        "Add keyboard shortcuts for the presenter view",
        "Honestly this is already better than Mentimeter",
      ]),
  },
];

// ─── Session 3: Workshop Planning (draft, no users) ───────

const WORKSHOP_QUESTIONS: QuestionDef[] = [
  {
    title: "Which workshop format do you prefer?",
    type: "multiple_choice",
    options: [
      "Half-day intensive (3-4 hours)",
      "Full-day immersive workshop",
      "Multi-day series (2-3 days)",
      "Weekly 2-hour sessions over a month",
    ],
    chartLayout: "bars",
    showResults: "always",
    generateAnswer: () => "",
  },
  {
    title: "What topic interests you the most?",
    type: "word_cloud",
    showResults: "always",
    generateAnswer: () => "",
  },
  {
    title: "Which days work best for you? (select all that apply)",
    type: "multiple_choice",
    options: ["Monday", "Wednesday", "Friday", "Saturday"],
    allowMultiple: true,
    chartLayout: "pie",
    showResults: "after_submit",
    generateAnswer: () => "",
  },
  {
    title: "How important is hands-on practice vs theory?",
    type: "rating",
    showResults: "always",
    generateAnswer: () => "",
  },
  {
    title: "What tools or technologies should we cover?",
    type: "open_ended",
    timeLimit: 120,
    showResults: "after_close",
    generateAnswer: () => "",
  },
  {
    title: "What's your preferred group size for workshops?",
    type: "multiple_choice",
    options: [
      "Small (5-10 people)",
      "Medium (15-25 people)",
      "Large (30-50 people)",
      "Size doesn't matter to me",
    ],
    chartLayout: "donut",
    showResults: "always",
    generateAnswer: () => "",
  },
  {
    title: "Your biggest learning goal for 2026",
    type: "word_cloud",
    timeLimit: 30,
    showResults: "always",
    generateAnswer: () => "",
  },
  {
    title: "Any dietary restrictions or accessibility needs we should know about?",
    type: "open_ended",
    showResults: "always",
    generateAnswer: () => "",
  },
];

// ─── Session Configs ──────────────────────────────────────

interface SessionConfig {
  title: string;
  finalStatus: "draft" | "active" | "ended";
  participantCount: number;
  questions: QuestionDef[];
  /** How many questions get responses (0 = none, e.g. draft) */
  respondToQuestions: number;
  /** % of participants who respond to the last answered question (simulates in-progress voting) */
  partialLastQuestion: number;
}

const SESSIONS: SessionConfig[] = [
  {
    title: "All-Hands Q4 Retrospective",
    finalStatus: "ended",
    participantCount: 80,
    questions: RETRO_QUESTIONS,
    respondToQuestions: 8,
    partialLastQuestion: 100,
  },
  {
    title: "Product Launch — Votez 2.0",
    finalStatus: "active",
    participantCount: 100,
    questions: LAUNCH_QUESTIONS,
    respondToQuestions: 6,
    partialLastQuestion: 65,
  },
  {
    title: "Annual Planning Workshop",
    finalStatus: "draft",
    participantCount: 0,
    questions: WORKSHOP_QUESTIONS,
    respondToQuestions: 0,
    partialLastQuestion: 0,
  },
];

// ═══════════════════════════════════════════════════════════
//  Main
// ═══════════════════════════════════════════════════════════

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);
  const startTime = Date.now();

  console.log(`
\x1b[1m╔═══════════════════════════════════════════════════════╗
║  VOTEZ SEED — Create Demo Sessions                    ║
║                                                       ║
║  1. All-Hands Q4 Retro        ended   80 participants ║
║  2. Product Launch Feedback    live   100 participants ║
║  3. Annual Planning Workshop   draft    0 participants ║
╚═══════════════════════════════════════════════════════╝\x1b[0m
`);

  // ─── Authenticate ───────────────────────────────────────
  logSection("Phase 0: Authenticate");
  log("Logging in to Supabase...");
  const presenter = await authenticate();
  logOk(`Logged in as \x1b[1m${presenter.name}\x1b[0m (${presenter.id.slice(0, 8)}...)`);

  const created: { title: string; code: string; id: Id<"sessions">; status: string }[] = [];

  for (let si = 0; si < SESSIONS.length; si++) {
    const cfg = SESSIONS[si];
    logSection(`Session ${si + 1}/${SESSIONS.length}: ${cfg.title}`);

    // ── 1. Create session (always starts as draft) ────────
    log("Creating session...");
    const { sessionId, code } = await client.mutation(api.sessions.create, {
      title: cfg.title,
      presenterId: presenter.id,
      presenterName: presenter.name,
    });
    logOk(`Created — code: \x1b[1m${code}\x1b[0m`);

    // ── 2. Add 8 questions (session must be draft) ────────
    log(`Adding ${cfg.questions.length} questions...`);
    const questionIds: Id<"questions">[] = [];
    for (const q of cfg.questions) {
      const qId = await client.mutation(api.questions.create, {
        sessionId,
        title: q.title,
        type: q.type,
        ...(q.options && { options: q.options }),
        ...(q.timeLimit && { timeLimit: q.timeLimit }),
        ...(q.chartLayout && { chartLayout: q.chartLayout }),
        ...(q.allowMultiple !== undefined && { allowMultiple: q.allowMultiple }),
        ...(q.correctAnswer && { correctAnswer: q.correctAnswer }),
        ...(q.showResults && { showResults: q.showResults }),
      });
      questionIds.push(qId);
    }
    logOk(`${questionIds.length} questions added`);

    // ── 3. If needs participants, activate & populate ─────
    if (cfg.participantCount > 0 && cfg.respondToQuestions > 0) {
      // Activate session
      await client.mutation(api.sessions.updateStatus, { sessionId, status: "active" });
      log("Session activated");

      // Join participants
      log(`Joining ${cfg.participantCount} participants...`);
      const indices = Array.from({ length: cfg.participantCount }, (_, i) => i);
      const participantIds = await batchRun(
        indices,
        (i) =>
          client.mutation(api.participants.join, {
            sessionId,
            uniqueId: `seed-${sessionId}-${i}`,
            name: generateName(i),
          }),
        BATCH_SIZE,
        (done, total) => process.stdout.write(`\r${bar(done, total)}`),
      );
      console.log();
      logOk(`${participantIds.length} participants joined`);

      // Submit responses per question
      for (let qi = 0; qi < cfg.respondToQuestions; qi++) {
        const q = cfg.questions[qi];
        const isLast = qi === cfg.respondToQuestions - 1;
        const respondingCount = isLast
          ? Math.floor((cfg.partialLastQuestion / 100) * participantIds.length)
          : participantIds.length;

        // Set this question as active (required by submit validation)
        await client.mutation(api.sessions.setActiveQuestion, {
          sessionId,
          questionId: questionIds[qi],
        });

        const label = q.title.length > 45 ? q.title.slice(0, 42) + "..." : q.title;
        log(`Q${qi + 1}: ${label} (${respondingCount} responses)`);

        const respondents = participantIds.slice(0, respondingCount);
        let errors = 0;
        await batchRun(
          respondents,
          (pId) =>
            client
              .mutation(api.responses.submit, {
                questionId: questionIds[qi],
                sessionId,
                participantId: pId,
                answer: q.generateAnswer(),
              })
              .catch(() => {
                errors++;
              }) as Promise<any>,
          BATCH_SIZE,
          (done, total) => process.stdout.write(`\r${bar(done, total)}`),
        );
        console.log();
        if (errors > 0) log(`\x1b[33m${errors} errors\x1b[0m`);
      }

      // Set final state
      if (cfg.finalStatus === "ended") {
        await client.mutation(api.sessions.setActiveQuestion, { sessionId });
        await client.mutation(api.sessions.updateStatus, { sessionId, status: "ended" });
        logOk("Session ended");
      } else if (cfg.finalStatus === "active") {
        // Leave the last responded question as the active one
        const activeQIdx = cfg.respondToQuestions - 1;
        await client.mutation(api.sessions.setActiveQuestion, {
          sessionId,
          questionId: questionIds[activeQIdx],
        });
        logOk(`Session live — Q${activeQIdx + 1} is active`);
      }
    } else {
      logOk("Draft session — no participants");
    }

    created.push({ title: cfg.title, code, id: sessionId, status: cfg.finalStatus });
  }

  // ─── Summary ────────────────────────────────────────────
  const totalSecs = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`
\x1b[1m╔═══════════════════════════════════════════════════════╗
║  SEED COMPLETE  (${totalSecs}s)${" ".repeat(Math.max(0, 36 - totalSecs.length))}║
╠═══════════════════════════════════════════════════════╣\x1b[0m`);
  for (const s of created) {
    const icon = s.status === "ended" ? "  " : s.status === "active" ? ">>" : "  ";
    const statusLabel =
      s.status === "ended" ? "\x1b[90mended\x1b[0m " : s.status === "active" ? "\x1b[32mlive\x1b[0m  " : "\x1b[33mdraft\x1b[0m ";
    console.log(`\x1b[1m║\x1b[0m ${icon} \x1b[1m${s.code}\x1b[0m  ${statusLabel}  ${s.title}`);
  }
  console.log(`\x1b[1m╚═══════════════════════════════════════════════════════╝\x1b[0m

  \x1b[36mDashboard:\x1b[0m  http://localhost:5173/dashboard
`);

  process.exit(0);
}

main().catch((err) => {
  console.error("\n\x1b[31m✗ Seed failed:\x1b[0m", err);
  process.exit(1);
});
