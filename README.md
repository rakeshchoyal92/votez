# Votez - Live Interactive Polling

A real-time polling web app. Presenters create sessions, audience joins via QR code, results update live.

**Stack**: React + Vite + TypeScript, Supabase Auth, Convex (real-time data), Tailwind CSS

## Setup

### 1. Install dependencies

```bash
cd votez
npm install
```

### 2. Create a Convex project

```bash
npx convex dev
```

This will:
- Create a Convex project (or link to an existing one)
- Deploy your schema and functions
- Generate the `convex/_generated/` types
- Set `CONVEX_DEPLOYMENT` in `.env.local`
- Print your deployment URL

Copy the deployment URL and set it in `.env.local`:

```
VITE_CONVEX_URL=https://your-project-123.convex.cloud
```

### 3. Configure Supabase Auth

The `.env.local` already has the Supabase URL and anon key configured for the Newbiez project.

If using a different Supabase project, update:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Configure Convex Auth (Supabase JWT verification)

In the Convex dashboard (https://dashboard.convex.dev):
1. Go to your project → Settings → Authentication
2. Add a new auth provider with:
   - **Domain**: `https://svaxyhjoanqvadottcda.supabase.co/auth/v1`
   - **Application ID**: `supabase`

### 5. Run the app

In two terminals:

```bash
# Terminal 1: Convex dev server (syncs schema/functions, watches for changes)
npx convex dev

# Terminal 2: Vite dev server
npm run dev
```

Open http://localhost:5173

## How It Works

### Presenter Flow
1. Sign up / Sign in (Supabase Auth)
2. Create a session from the Dashboard
3. Add questions (Multiple Choice, Word Cloud, Open Ended, Rating)
4. Click "Present" to go fullscreen
5. Share QR code with audience
6. Navigate through questions, see live results

### Audience Flow
1. Scan QR code or enter join code at the homepage
2. Enter optional name
3. Wait for session to start
4. Vote/answer as questions appear
5. See "submitted" confirmation after each answer

## Question Types

- **Multiple Choice**: Pick from 2-8 options. Results shown as bar chart.
- **Word Cloud**: Submit short text. Results shown as weighted word cloud.
- **Open Ended**: Free text responses. Listed as cards.
- **Rating**: 1-5 stars. Results shown as distribution chart.

## Project Structure

```
votez/
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema
│   ├── auth.config.ts       # Supabase JWT config
│   ├── sessions.ts          # Session CRUD + management
│   ├── questions.ts         # Question CRUD
│   ├── participants.ts      # Audience join/tracking
│   └── responses.ts         # Vote submission + aggregation
├── src/
│   ├── main.tsx             # App entry (Convex + Auth providers)
│   ├── App.tsx              # Router + protected routes
│   ├── contexts/
│   │   └── auth-context.tsx # Supabase auth state
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # Helpers (device ID, colors, cn)
│   ├── pages/
│   │   ├── home.tsx         # Landing + join code input
│   │   ├── login.tsx        # Sign in / Sign up
│   │   ├── dashboard.tsx    # Session list + create
│   │   ├── session-editor.tsx # Add/edit questions
│   │   ├── presenter.tsx    # Fullscreen presentation + live results
│   │   └── audience.tsx     # Mobile voting interface
│   └── components/
│       ├── results-chart.tsx # Bar chart for MC results
│       └── word-cloud.tsx   # Weighted word cloud display
└── .env.local               # Environment variables
```
