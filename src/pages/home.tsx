import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/layout/logo'

export function HomePage() {
  const [joinCode, setJoinCode] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (code.length >= 4) navigate(`/join/${code}`)
  }

  return (
    <TooltipProvider>
      <style>{`
        @keyframes count-pop { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .count-pop { animation: count-pop 0.3s ease-out; }
        @keyframes fade-up-home { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="min-h-screen bg-background flex flex-col">
        {/* ── Minimal Nav ── */}
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <Button size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
              )}
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            {/* Headline */}
            <div
              className="space-y-6"
              style={{ animation: 'fade-up-home 0.7s ease-out both' }}
            >
              <h1 className="font-display text-[4rem] sm:text-[6rem] lg:text-[8rem] leading-[0.9] tracking-tight text-foreground">
                Live polls,
                <br />
                zero friction.
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                Join with a code. Vote. Watch results stream in.
              </p>
            </div>

            {/* Join form */}
            <form
              onSubmit={handleJoin}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              style={{ animation: 'fade-up-home 0.7s ease-out 0.1s both' }}
            >
              <Input
                type="text"
                placeholder="Enter code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 h-14 text-center text-xl font-mono tracking-[0.25em] uppercase"
              />
              <Button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="h-14 px-8"
              >
                Join
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            {/* Demo */}
            <div
              className="pt-8"
              style={{ animation: 'fade-up-home 0.7s ease-out 0.25s both' }}
            >
              <HomePollDemo />
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-6 text-center">
            <span className="text-sm text-muted-foreground">
              Built for presenters & teams
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}

/* ─── Live Poll Demo (matches login page style) ─── */

const POLL_OPTIONS = [
  { label: 'Arts & Crafts',   color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500' },
  { label: 'Outdoor Play',    color: 'from-emerald-500 to-teal-500',  bg: 'bg-emerald-500' },
  { label: 'Story Time',      color: 'from-orange-500 to-amber-500',  bg: 'bg-orange-500' },
  { label: 'Music & Dance',   color: 'from-sky-500 to-cyan-500',      bg: 'bg-sky-500' },
  { label: 'Science Explore', color: 'from-rose-500 to-pink-500',     bg: 'bg-rose-500' },
]

const INITIAL_VOTES = [0, 0, 0, 0, 0]

function HomePollDemo() {
  const [votes, setVotes] = useState(INITIAL_VOTES)
  const [changedIdx, setChangedIdx] = useState<number | null>(null)
  const prevVotesRef = useRef(INITIAL_VOTES)

  useEffect(() => {
    const tick = () => {
      setVotes((prev) => {
        const next = [...prev]
        const weights = [0.3, 0.25, 0.2, 0.15, 0.1]
        const r = Math.random()
        let cumulative = 0
        let pick = 0
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i]
          if (r < cumulative) { pick = i; break }
        }
        const burst = Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 2 : 1
        next[pick] += burst
        prevVotesRef.current = prev
        setChangedIdx(pick)
        return next
      })
    }
    let timeout: ReturnType<typeof setTimeout>
    const schedule = () => {
      timeout = setTimeout(() => {
        tick()
        schedule()
      }, 600 + Math.random() * 600)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (changedIdx === null) return
    const t = setTimeout(() => setChangedIdx(null), 300)
    return () => clearTimeout(t)
  }, [changedIdx, votes])

  const total = votes.reduce((s, v) => s + v, 0)
  const maxVote = Math.max(...votes)

  return (
    <div className="relative max-w-lg mx-auto">
      {/* Glow */}
      <div className="absolute -inset-6 bg-primary/5 rounded-3xl blur-2xl" />

      <div className="dark demo-card relative rounded-2xl overflow-hidden shadow-2xl shadow-black/25 border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
              Live Poll
            </p>
            <h3 className="text-white font-semibold mt-0.5">
              Favorite activity this week?
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            <span className="text-xs text-white/40 font-medium tabular-nums">
              {total} votes
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 py-5 space-y-3.5">
          {POLL_OPTIONS.map((opt, i) => {
            const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0
            const barWidth = maxVote > 0 ? Math.round((votes[i] / maxVote) * 100) : 0
            const isLeading = maxVote > 0 && votes[i] === maxVote
            const justChanged = changedIdx === i

            return (
              <div key={opt.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${opt.bg}`} />
                    <span className={`text-sm font-medium ${isLeading ? 'text-white' : 'text-white/70'}`}>
                      {opt.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs tabular-nums ${isLeading ? 'text-white/80' : 'text-white/40'} ${justChanged ? 'count-pop' : ''}`}
                      key={votes[i]}
                    >
                      {votes[i]}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums w-9 text-right ${isLeading ? 'text-white' : 'text-white/50'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${opt.color} transition-all duration-700 ease-out`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-1">
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-[hsl(222,47%,11%)] bg-gradient-to-br from-violet-400 to-indigo-500"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              ))}
              {total > 5 && (
                <div className="w-6 h-6 rounded-full border-2 border-[hsl(222,47%,11%)] bg-white/10 flex items-center justify-center">
                  <span className="text-[8px] text-white/60 font-medium">+{total - 5}</span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-white/30">
              Updates in real-time
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
