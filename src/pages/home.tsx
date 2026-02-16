import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/layout/logo'
import { getChartColor } from '@/lib/utils'

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
            <div className="space-y-6">
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
            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
            <div className="pt-8">
              <div className="animate-float">
                <LivePollDemo />
              </div>
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

/* ─── Animated Live Poll Demo ─── */

function LivePollDemo() {
  const [active, setActive] = useState(false)
  const [votes, setVotes] = useState(0)

  // Initial activation
  useEffect(() => {
    const t = setTimeout(() => setActive(true), 600)
    return () => clearTimeout(t)
  }, [])

  // Count up votes when active
  useEffect(() => {
    if (!active) {
      setVotes(0)
      return
    }
    let v = 0
    const id = setInterval(() => {
      v++
      setVotes(v)
      if (v >= 47) clearInterval(id)
    }, 35)
    return () => clearInterval(id)
  }, [active])

  // Loop every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActive(false)
      setTimeout(() => setActive(true), 400)
    }, 8000)
    return () => clearInterval(id)
  }, [])

  const bars = [
    { label: 'Real-time results', pct: 42 },
    { label: 'Easy setup', pct: 28 },
    { label: 'Word clouds', pct: 19 },
    { label: 'No app needed', pct: 11 },
  ]

  return (
    <div className="dark demo-card rounded-2xl overflow-hidden shadow-2xl shadow-black/25">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-foreground/10">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"
          />
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            Live
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
          {votes} responses
        </span>
      </div>

      {/* Poll content */}
      <div className="px-6 pb-6 pt-4">
        <p className="text-foreground font-semibold mb-5">
          What matters most to you?
        </p>
        <div className="space-y-3.5">
          {bars.map((bar, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-foreground/70">{bar.label}</span>
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {active ? bar.pct : 0}%
                </span>
              </div>
              <div className="h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: active ? `${bar.pct}%` : '0%',
                    backgroundColor: getChartColor(i),
                    transition: `width 1.2s cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
