/**
 * Votez Load Test
 *
 * Two modes:
 *
 * POOL MODE (default) — Fast throughput test
 *   50 WebSocket clients fire mutations for 1000 virtual participants.
 *   Tests mutation throughput, NOT connection scalability.
 *
 * REALISTIC MODE (--realistic) — True 1:1 simulation
 *   1 WebSocket per participant, connections trickle in over minutes
 *   (like real users scanning a QR code). Tests the full stack:
 *   connection limits, subscription fan-out, and mutation throughput.
 *
 * Usage:
 *   npx tsx scripts/load-test.ts 100                    # pool mode, 100 users
 *   npx tsx scripts/load-test.ts 1000 --keep            # pool mode, keep session
 *   npx tsx scripts/load-test.ts 500 --realistic        # realistic mode
 *   npx tsx scripts/load-test.ts 1000 --realistic --keep
 *   VOTEZ_EMAIL=x VOTEZ_PASSWORD=y npx tsx scripts/load-test.ts 200
 */

import { createClient } from "@supabase/supabase-js";
import { ConvexHttpClient, ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import type { Id } from "../convex/_generated/dataModel.js";
import * as readline from "node:readline";

// ─── Config ───────────────────────────────────────────────

const CONVEX_URL = "https://bold-starfish-650.convex.cloud";
const SUPABASE_URL = "https://svaxyhjoanqvadottcda.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2YXh5aGpvYW5xdmFkb3R0Y2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzOTIzNDIsImV4cCI6MjA1Njk2ODM0Mn0.N_2euKBDfoJiXPCYnWau7wD9b-t7tGmMx8cFNfmUy48";

const PARTICIPANT_COUNT = parseInt(process.argv[2] || "100", 10);
const KEEP_SESSION = process.argv.includes("--keep");
const REALISTIC = process.argv.includes("--realistic");
const QUESTION_PAUSE_MS = 5000;
const VOTE_SPREAD_MS = 8000; // votes trickle in over this window (0 = all at once)

// Pool mode config
const POOL_SIZE = 50;
const POOL_CONNECT_BATCH = 40;
const POOL_CONNECT_DELAY_MS = 500;

// Realistic mode config — slow trickle like real users scanning a QR code
const REALISTIC_CONNECT_BATCH = 5;   // ~5 users join per second
const REALISTIC_CONNECT_DELAY_MS = 1000;
const REALISTIC_RETRY_DELAY_MS = 3000;

const WS_CONNECT_TIMEOUT_MS = 10_000;

// ─── Data Pools ───────────────────────────────────────────

// Q2: Word cloud — describe Newbiez in one word
const WORD_CLOUD_WORDS = [
  "nurturing", "creative", "fun", "safe", "caring",
  "colourful", "loving", "playful", "warm", "happy",
  "inclusive", "friendly", "vibrant", "amazing", "home",
  "joyful", "clean", "wonderful", "innovative", "trusted",
  "excellent", "supportive", "bright", "cheerful", "fantastic",
];

// Q4: Open-ended — suggestions for improvement
const OPEN_ENDED_PHRASES = [
  "Would love more outdoor play time for the kids",
  "The teachers are incredibly caring and attentive",
  "My child has grown so much since joining Newbiez",
  "Could we have more parent-teacher interaction sessions",
  "The curriculum is well-balanced and age-appropriate",
  "Love the daily updates and photos we receive",
  "Would appreciate a dedicated pickup and drop zone",
  "The art and craft activities are my child's favourite",
  "Hygiene and cleanliness standards are top-notch",
  "More field trips and nature walks would be great",
  "The staff-to-child ratio makes me feel very comfortable",
  "My kid loves the storytelling sessions",
  "Would be great to have a mobile app for daily reports",
  "The food quality and menu variety is excellent",
  "Wish there were weekend enrichment programs too",
  "The safety measures give us complete peace of mind",
  "Music and dance classes have boosted my child's confidence",
  "The transition from playgroup to nursery was very smooth",
  "Would love to see more regional language exposure",
  "Best daycare decision we ever made for our family",
];

const FIRST_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
  "Iris", "Jack", "Kate", "Liam", "Mia", "Noah", "Olivia", "Peter",
  "Quinn", "Rachel", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xander",
  "Yara", "Zack", "Aria", "Ben", "Chloe", "Dan", "Elena", "Felix",
  "Gina", "Hugo", "Ivy", "James", "Kira", "Leo", "Maya", "Nate",
];

// ─── Helpers ──────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function randomRating(): string {
  const weights = [5, 15, 25, 35, 20];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return String(i + 1);
  }
  return "4";
}

function generateAnswer(questionIndex: number): string {
  switch (questionIndex) {
    case 0: // MC: Why did you choose Newbiez?
      return pick([
        "Safe and nurturing environment",
        "Qualified and caring teachers",
        "Play-based learning curriculum",
        "Convenient location in Chennai",
      ]);
    case 1: // Word cloud: Describe Newbiez in one word
      return pick(WORD_CLOUD_WORDS);
    case 2: // MC: Favourite activity
      return pick([
        "Art and craft",
        "Storytelling and reading",
        "Music and dance",
        "Outdoor play and sports",
        "Science experiments",
      ]);
    case 3: // Open-ended: Suggestions
      return pick(OPEN_ENDED_PHRASES);
    case 4: // Rating: Overall experience
      return randomRating();
    case 5: // MC: Recommend to other parents?
      return pick([
        "Definitely yes",
        "Probably yes",
        "Not sure yet",
        "Need more time to decide",
      ]);
    default:
      return "test";
  }
}

function progressBar(current: number, total: number, width = 30): string {
  const pct = current / total;
  const filled = Math.round(width * pct);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return `  ${bar} ${current}/${total}`;
}

function elapsed(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

function eta(current: number, total: number, startMs: number): string {
  if (current === 0) return "...";
  const elapsedMs = Date.now() - startMs;
  const rate = current / elapsedMs;
  const remaining = (total - current) / rate;
  const secs = Math.ceil(remaining / 1000);
  if (secs < 60) return `~${secs}s`;
  return `~${Math.floor(secs / 60)}m${secs % 60}s`;
}

function log(msg: string) {
  console.log(`\x1b[36m▸\x1b[0m ${msg}`);
}
function logSuccess(msg: string) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}
function logSection(msg: string) {
  console.log(`\n\x1b[1m${msg}\x1b[0m`);
}

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

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

// ─── Auth ─────────────────────────────────────────────────

async function authenticate(): Promise<{ id: string; name: string }> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let email = process.env.VOTEZ_EMAIL || "";
  let password = process.env.VOTEZ_PASSWORD || "";

  if (!email) email = await prompt("  Email: ");
  if (!password) password = await prompt("  Password: ", true);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed: ${error.message}`);

  const user = data.user;
  const name = user.user_metadata?.full_name ?? user.email ?? "Presenter";
  return { id: user.id, name };
}

// ─── WebSocket helpers ───────────────────────────────────

function waitForConnection(client: ConvexClient): Promise<ConvexClient> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsub();
      client.close();
      reject(new Error("timeout"));
    }, WS_CONNECT_TIMEOUT_MS);

    const unsub = client.subscribeToConnectionState((state) => {
      if (state.isWebSocketConnected) {
        clearTimeout(timeout);
        unsub();
        resolve(client);
      }
    });
  });
}

/** Connect a batch of WebSocket clients, returns only successful ones */
async function connectBatch(count: number): Promise<ConvexClient[]> {
  const clients: ConvexClient[] = [];
  for (let i = 0; i < count; i++) {
    clients.push(new ConvexClient(CONVEX_URL));
  }
  const results = await Promise.allSettled(clients.map(waitForConnection));
  return results
    .filter((r): r is PromiseFulfilledResult<ConvexClient> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ─── Pool Mode ───────────────────────────────────────────

async function createPool(size: number): Promise<ConvexClient[]> {
  const clients: ConvexClient[] = [];
  let failed = 0;

  for (let batch = 0; batch < size; batch += POOL_CONNECT_BATCH) {
    const batchSize = Math.min(POOL_CONNECT_BATCH, size - batch);
    const connected = await connectBatch(batchSize);
    clients.push(...connected);
    failed += batchSize - connected.length;

    process.stdout.write(
      `\r${progressBar(clients.length + failed, size)} ${clients.length} connected${failed > 0 ? `, \x1b[31m${failed} failed\x1b[0m` : ""}`
    );

    if (batch + POOL_CONNECT_BATCH < size) {
      await sleep(POOL_CONNECT_DELAY_MS);
    }
  }

  console.log();
  if (failed > 0) {
    log(`\x1b[33m${failed} connections failed — continuing with ${clients.length}\x1b[0m`);
  }
  return clients;
}

function distribute(total: number, poolSize: number): number[][] {
  const buckets: number[][] = Array.from({ length: poolSize }, () => []);
  for (let i = 0; i < total; i++) {
    buckets[i % poolSize].push(i);
  }
  return buckets;
}

async function runPoolMode(
  sessionId: Id<"sessions">,
  questionIds: Id<"questions">[],
  questionLabels: string[],
  admin: ConvexHttpClient,
) {
  const effectivePoolSize = Math.min(POOL_SIZE, PARTICIPANT_COUNT);

  // ─── Connect pool ─────────────────────────────────────
  logSection(`Phase 2: Opening ${effectivePoolSize} WebSocket connections`);
  let t = Date.now();
  const pool = await createPool(effectivePoolSize);
  logSuccess(`${pool.length} WebSockets connected (${elapsed(t)})`);

  const buckets = distribute(PARTICIPANT_COUNT, pool.length);
  log(`Distribution: ${pool.length} clients × ~${Math.ceil(PARTICIPANT_COUNT / pool.length)} participants each`);

  // ─── Join ─────────────────────────────────────────────
  logSection(`Phase 3: Joining ${PARTICIPANT_COUNT} participants`);
  t = Date.now();
  let joined = 0;
  const participantIds: (Id<"participants"> | null)[] = new Array(PARTICIPANT_COUNT).fill(null);

  await Promise.all(
    pool.map((client, ci) =>
      Promise.all(
        buckets[ci].map((i) =>
          client
            .mutation(api.participants.join, {
              sessionId,
              uniqueId: `load-test-${sessionId}-${i}`,
              name: `${pick(FIRST_NAMES)} #${i + 1}`,
            })
            .then((id) => {
              participantIds[i] = id;
              joined++;
              if (joined % 100 === 0 || joined === PARTICIPANT_COUNT) {
                process.stdout.write(`\r${progressBar(joined, PARTICIPANT_COUNT)}`);
              }
            })
            .catch(() => {})
        )
      )
    )
  );
  console.log();
  logSuccess(`${joined}/${PARTICIPANT_COUNT} joined (${elapsed(t)}) — ${rate(joined, t)} joins/sec`);

  // ─── Vote per question ────────────────────────────────
  for (let qi = 0; qi < questionIds.length; qi++) {
    logSection(`Question ${qi + 1}/${questionIds.length}: ${questionLabels[qi]}`);
    await admin.mutation(api.sessions.setActiveQuestion, {
      sessionId,
      questionId: questionIds[qi] as any,
    });
    log(`Active question set — waiting ${QUESTION_PAUSE_MS / 1000}s...`);
    await sleep(QUESTION_PAUSE_MS);

    log(`Submitting ${joined} votes (spread over ${VOTE_SPREAD_MS / 1000}s)...`);
    t = Date.now();
    let submitted = 0;
    let errors = 0;

    await Promise.all(
      pool.map((client, ci) =>
        Promise.all(
          buckets[ci]
            .filter((i) => participantIds[i] !== null)
            .map((i) => {
              const delay = VOTE_SPREAD_MS > 0 ? Math.random() * VOTE_SPREAD_MS : 0;
              return sleep(delay).then(() =>
                client
                  .mutation(api.responses.submit, {
                    questionId: questionIds[qi] as Id<"questions">,
                    sessionId,
                    participantId: participantIds[i]!,
                    answer: generateAnswer(qi),
                  })
                  .then(() => {
                    submitted++;
                    if (submitted % 50 === 0 || submitted === joined) {
                      process.stdout.write(`\r${progressBar(submitted, joined)}`);
                    }
                  })
                  .catch(() => { errors++; })
              );
            })
        )
      )
    );
    console.log();
    logSuccess(`${submitted} votes (${elapsed(t)}) — ${rate(submitted, t)} votes/sec${errors > 0 ? ` \x1b[31m${errors} errors\x1b[0m` : ""}`);
  }

  // ─── Close pool ───────────────────────────────────────
  log("Closing WebSocket pool...");
  await Promise.all(pool.map((c) => c.close()));
  logSuccess(`${pool.length} connections closed`);

  return { joined, socketCount: pool.length };
}

// ─── Realistic Mode ──────────────────────────────────────

interface Participant {
  client: ConvexClient;
  id: Id<"participants">;
  index: number;
}

async function runRealisticMode(
  sessionId: Id<"sessions">,
  questionIds: Id<"questions">[],
  questionLabels: string[],
  admin: ConvexHttpClient,
) {
  const participants: Participant[] = [];
  let failed = 0;
  const estTime = Math.ceil(PARTICIPANT_COUNT / REALISTIC_CONNECT_BATCH) * (REALISTIC_CONNECT_DELAY_MS / 1000);

  // ─── Connect + join simultaneously ────────────────────
  // Like real users: scan QR → browser opens → WebSocket connects → join mutation fires
  logSection(`Phase 2+3: Connecting & joining ${PARTICIPANT_COUNT} participants`);
  log(`Rate: ~${REALISTIC_CONNECT_BATCH}/sec — estimated ${estTime > 60 ? `${Math.floor(estTime / 60)}m${estTime % 60}s` : `${estTime}s`}`);

  let t = Date.now();

  for (let batch = 0; batch < PARTICIPANT_COUNT; batch += REALISTIC_CONNECT_BATCH) {
    const batchSize = Math.min(REALISTIC_CONNECT_BATCH, PARTICIPANT_COUNT - batch);
    const indices = Array.from({ length: batchSize }, (_, k) => batch + k);

    // Connect this batch
    const connected = await connectBatch(batchSize);
    const batchFailed = batchSize - connected.length;
    failed += batchFailed;

    // Immediately join each connected client (like a real user would)
    const joinResults = await Promise.allSettled(
      connected.map((client, k) => {
        const i = indices[k + (batchSize - connected.length)]; // skip failed indices
        // Find the correct index for this client
        const actualIndex = indices[k < batchFailed ? k : k]; // simplified — use batch offset
        const idx = batch + k;
        return client
          .mutation(api.participants.join, {
            sessionId,
            uniqueId: `load-test-${sessionId}-${idx}`,
            name: `${pick(FIRST_NAMES)} #${idx + 1}`,
          })
          .then((id) => {
            participants.push({ client, id, index: idx });
          })
          .catch(() => {
            client.close();
            failed++;
          });
      })
    );

    const total = participants.length + failed;
    process.stdout.write(
      `\r${progressBar(total, PARTICIPANT_COUNT)} ${participants.length} joined${failed > 0 ? `, \x1b[31m${failed} failed\x1b[0m` : ""} (ETA ${eta(total, PARTICIPANT_COUNT, t)})`
    );

    // Slow down if we hit failures (rate limiting)
    if (batchFailed > 0 && batchFailed === batchSize) {
      log(`\n\x1b[33m  Entire batch failed — pausing ${REALISTIC_RETRY_DELAY_MS / 1000}s...\x1b[0m`);
      await sleep(REALISTIC_RETRY_DELAY_MS);
    } else if (batchFailed > 0) {
      await sleep(REALISTIC_RETRY_DELAY_MS);
    } else if (batch + REALISTIC_CONNECT_BATCH < PARTICIPANT_COUNT) {
      await sleep(REALISTIC_CONNECT_DELAY_MS);
    }
  }

  console.log();
  logSuccess(`${participants.length}/${PARTICIPANT_COUNT} connected & joined (${elapsed(t)})`);
  if (participants.length === 0) {
    throw new Error("No participants connected — cannot continue");
  }

  // ─── Vote per question ────────────────────────────────
  // Each participant votes through their own WebSocket — exactly like real usage
  const joined = participants.length;

  for (let qi = 0; qi < questionIds.length; qi++) {
    logSection(`Question ${qi + 1}/${questionIds.length}: ${questionLabels[qi]}`);
    await admin.mutation(api.sessions.setActiveQuestion, {
      sessionId,
      questionId: questionIds[qi] as any,
    });
    log(`Active question set — waiting ${QUESTION_PAUSE_MS / 1000}s...`);
    await sleep(QUESTION_PAUSE_MS);

    log(`Submitting ${joined} votes (spread over ${VOTE_SPREAD_MS / 1000}s)...`);
    t = Date.now();
    let submitted = 0;
    let errors = 0;

    await Promise.all(
      participants.map((p) => {
        const delay = VOTE_SPREAD_MS > 0 ? Math.random() * VOTE_SPREAD_MS : 0;
        return sleep(delay).then(() =>
          p.client
            .mutation(api.responses.submit, {
              questionId: questionIds[qi] as Id<"questions">,
              sessionId,
              participantId: p.id,
              answer: generateAnswer(qi),
            })
            .then(() => {
              submitted++;
              if (submitted % 50 === 0 || submitted === joined) {
                process.stdout.write(`\r${progressBar(submitted, joined)}`);
              }
            })
            .catch(() => { errors++; })
        );
      })
    );
    console.log();
    logSuccess(`${submitted} votes (${elapsed(t)}) — ${rate(submitted, t)} votes/sec${errors > 0 ? ` \x1b[31m${errors} errors\x1b[0m` : ""}`);
  }

  // ─── Close all connections ────────────────────────────
  log(`Closing ${participants.length} WebSocket connections...`);
  await Promise.all(participants.map((p) => p.client.close()));
  logSuccess("All connections closed");

  return { joined, socketCount: participants.length };
}

// ─── Rate helper ─────────────────────────────────────────

function rate(count: number, startMs: number): string {
  const secs = (Date.now() - startMs) / 1000;
  return secs > 0 ? (count / secs).toFixed(0) : "0";
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const admin = new ConvexHttpClient(CONVEX_URL);
  const startTime = Date.now();
  const mode = REALISTIC ? "REALISTIC" : "POOL";

  if (REALISTIC) {
    const estConnect = Math.ceil(PARTICIPANT_COUNT / REALISTIC_CONNECT_BATCH);
    console.log(`
\x1b[1m╔═══════════════════════════════════════════════════════╗
║  VOTEZ LOAD TEST — Realistic Mode                    ║
║  ${String(PARTICIPANT_COUNT).padEnd(5)} participants × 1 WebSocket each           ║
║  Connection rate: ~${REALISTIC_CONNECT_BATCH}/sec (~${estConnect > 60 ? `${Math.floor(estConnect / 60)}m` : `${estConnect}s`} to connect all)           ║
║  Tests: connections + subscriptions + mutations      ║
╚═══════════════════════════════════════════════════════╝\x1b[0m
`);
  } else {
    const effectivePoolSize = Math.min(POOL_SIZE, PARTICIPANT_COUNT);
    console.log(`
\x1b[1m╔═══════════════════════════════════════════════════════╗
║  VOTEZ LOAD TEST — Pool Mode                         ║
║  ${String(PARTICIPANT_COUNT).padEnd(5)} participants via ${String(effectivePoolSize).padEnd(3)} WebSocket clients      ║
║  ~${String(Math.ceil(PARTICIPANT_COUNT / effectivePoolSize)).padEnd(3)} mutations per client (no serialization)    ║
║  Tests: mutation throughput only                     ║
╚═══════════════════════════════════════════════════════╝\x1b[0m
`);
  }

  // ─── Phase 0: Authenticate ───────────────────────────

  logSection("Phase 0: Authenticate");
  log("Logging in to Supabase...");
  const presenter = await authenticate();
  logSuccess(`Logged in as \x1b[1m${presenter.name}\x1b[0m (${presenter.id.slice(0, 8)}...)`);

  // ─── Phase 1: Create Session ──────────────────────────

  logSection("Phase 1: Setup");

  log("Creating session...");
  const { sessionId, code } = await admin.mutation(api.sessions.create, {
    title: `Newbiez International Public School — Parent Feedback`,
    presenterId: presenter.id,
    presenterName: presenter.name,
  });
  logSuccess(`Session created: \x1b[1m${code}\x1b[0m`);

  log("Adding 6 questions...");
  const q1Id = await admin.mutation(api.questions.create, {
    sessionId,
    title: "Why did you choose Newbiez International Public School for your child?",
    type: "multiple_choice",
    options: [
      "Safe and nurturing environment",
      "Qualified and caring teachers",
      "Play-based learning curriculum",
      "Convenient location in Chennai",
    ],
  });
  const q2Id = await admin.mutation(api.questions.create, {
    sessionId,
    title: "Describe Newbiez in one word",
    type: "word_cloud",
  });
  const q3Id = await admin.mutation(api.questions.create, {
    sessionId,
    title: "What is your child's favourite activity at Newbiez?",
    type: "multiple_choice",
    options: [
      "Art and craft",
      "Storytelling and reading",
      "Music and dance",
      "Outdoor play and sports",
      "Science experiments",
    ],
  });
  const q4Id = await admin.mutation(api.questions.create, {
    sessionId,
    title: "What suggestions do you have to make Newbiez even better?",
    type: "open_ended",
  });
  const q5Id = await admin.mutation(api.questions.create, {
    sessionId,
    title: "How would you rate your overall experience with Newbiez?",
    type: "rating",
  });
  const q6Id = await admin.mutation(api.questions.create, {
    sessionId,
    title: "Would you recommend Newbiez to other parents?",
    type: "multiple_choice",
    options: [
      "Definitely yes",
      "Probably yes",
      "Not sure yet",
      "Need more time to decide",
    ],
  });
  const questionIds = [q1Id, q2Id, q3Id, q4Id, q5Id, q6Id] as Id<"questions">[];
  const questionLabels = [
    "Why Newbiez? (MC)",
    "One Word (Word Cloud)",
    "Favourite Activity (MC)",
    "Suggestions (Open Ended)",
    "Overall Rating",
    "Recommend? (MC)",
  ];
  logSuccess("6 questions added");

  log("Starting session...");
  await admin.mutation(api.sessions.updateStatus, { sessionId, status: "active" });
  await admin.mutation(api.sessions.setActiveQuestion, {
    sessionId,
    questionId: questionIds[0] as any,
  });
  logSuccess("Session is LIVE");

  console.log(`
  \x1b[33m╭─────────────────────────────────────────────╮
  │  Open your browser NOW to watch live:        │
  │                                               │
  │  Presenter: \x1b[0mhttp://localhost:5173/present/${sessionId}\x1b[33m
  │  Dashboard: \x1b[0mhttp://localhost:5173/dashboard\x1b[33m
  │  Audience:  \x1b[0mhttp://localhost:5173/join/${code}\x1b[33m
  ╰─────────────────────────────────────────────╯\x1b[0m
`);

  log("Waiting 8 seconds for you to open the presenter view...");
  await sleep(8000);

  // ─── Run mode ─────────────────────────────────────────

  const result = REALISTIC
    ? await runRealisticMode(sessionId, questionIds, questionLabels, admin)
    : await runPoolMode(sessionId, questionIds, questionLabels, admin);

  // ─── Cleanup ──────────────────────────────────────────

  logSection("Wrap up");

  await admin.mutation(api.sessions.updateStatus, { sessionId, status: "ended" });
  logSuccess("Session ended");

  if (!KEEP_SESSION) {
    log("Deleting session...");
    await admin.mutation(api.sessions.remove, { sessionId });
    logSuccess("Session deleted");
  } else {
    log(`Session kept — code: \x1b[1m${code}\x1b[0m`);
    log(`View results: http://localhost:5173/session/${sessionId}`);
  }

  const totalElapsed = elapsed(startTime);
  const totalMutations = 1 + 6 + 1 + 1 + result.joined + result.joined * 6 + 1 + (KEEP_SESSION ? 0 : 1);
  const mutRate = (totalMutations / ((Date.now() - startTime) / 1000)).toFixed(0);

  console.log(`
\x1b[1m╔═══════════════════════════════════════════════════════╗
║  COMPLETE — ${mode.padEnd(10)}                              ║
║  ${String(result.joined).padEnd(5)} participants via ${String(result.socketCount).padEnd(5)} WebSocket clients ║
║  ${String(totalMutations).padEnd(5)} mutations in ${totalElapsed.padEnd(6)} (${mutRate} mut/s)             ║
╚═══════════════════════════════════════════════════════╝\x1b[0m
`);

  process.exit(0);
}

main().catch((err) => {
  console.error("\n\x1b[31m✗ Load test failed:\x1b[0m", err);
  process.exit(1);
});
