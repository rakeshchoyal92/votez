import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (user) return null

  return (
    <>
      <style>{`
        @keyframes mesh-a { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(8%,-6%) scale(1.08)} }
        @keyframes mesh-b { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6%,8%) scale(0.92)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes bar-grow { from{width:0} to{width:var(--bar-w)} }
        @keyframes count-pop { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .count-pop { animation: count-pop 0.3s ease-out; }
      `}</style>

      <div className="min-h-screen flex bg-background">
        {/* ─── Left: Showcase (desktop) ─── */}
        <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-[#0a0a12]">
          {/* Mesh blobs */}
          <div className="absolute inset-0">
            <div
              className="absolute top-[-30%] left-[-10%] w-[700px] h-[700px] rounded-full bg-violet-600/25 blur-[120px]"
              style={{ animation: 'mesh-a 18s ease-in-out infinite' }}
            />
            <div
              className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px]"
              style={{ animation: 'mesh-b 22s ease-in-out infinite' }}
            />
          </div>

          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundSize: '48px 48px',
              backgroundImage:
                'linear-gradient(to right,rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.15) 1px,transparent 1px)',
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center w-full px-16 xl:px-20">
            {/* Tagline */}
            <div
              className="mb-14"
              style={{ animation: 'fade-up 0.8s ease-out both' }}
            >
              <h1 className="text-[3.2rem] xl:text-[3.6rem] font-bold leading-[1.1] tracking-tight text-white">
                Live polls,
                <br />
                <span className="bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  instant insights.
                </span>
              </h1>
              <p className="mt-4 text-lg text-white/50 max-w-sm font-light leading-relaxed">
                Engage any audience in seconds. No app downloads, no sign-ups for voters.
              </p>
            </div>

            {/* Live poll card */}
            <div style={{ animation: 'fade-up 0.8s ease-out 0.2s both' }}>
              <LivePollCard />
            </div>
          </div>

          {/* Bottom vignette */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a12] to-transparent pointer-events-none" />
        </div>

        {/* ─── Right: Sign-in form ─── */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
          <div
            className="w-full max-w-sm"
            style={{ animation: 'fade-up 0.6s ease-out both' }}
          >
            <Logo size="lg" className="mb-10 justify-center lg:justify-start" to="/" />

            <div className="space-y-6">
              <div className="lg:text-left text-center">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Sign in to your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-11"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Enter your password"
                      className="h-11 pr-10"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-base font-semibold mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Live Poll Demo Card ─── */

const POLL_OPTIONS = [
  { label: 'Arts & Crafts',    color: 'from-violet-500 to-purple-500', bg: 'bg-violet-500' },
  { label: 'Outdoor Play',     color: 'from-emerald-500 to-teal-500',  bg: 'bg-emerald-500' },
  { label: 'Story Time',       color: 'from-orange-500 to-amber-500',  bg: 'bg-orange-500' },
  { label: 'Music & Dance',    color: 'from-sky-500 to-cyan-500',      bg: 'bg-sky-500' },
  { label: 'Science Explore',  color: 'from-rose-500 to-pink-500',     bg: 'bg-rose-500' },
]

const INITIAL_VOTES = [0, 0, 0, 0, 0]

function LivePollCard() {
  const [votes, setVotes] = useState(INITIAL_VOTES)
  const prevVotesRef = useRef(INITIAL_VOTES)
  const [changedIdx, setChangedIdx] = useState<number | null>(null)

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
        // Variable vote bursts: 1–4 votes at a time
        const burst = Math.random() < 0.15 ? Math.floor(Math.random() * 3) + 2 : 1
        next[pick] += burst
        prevVotesRef.current = prev
        setChangedIdx(pick)
        return next
      })
    }
    // Randomized interval: 600–1200ms for snappy, varied feel
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

  // Clear pop animation
  useEffect(() => {
    if (changedIdx === null) return
    const t = setTimeout(() => setChangedIdx(null), 300)
    return () => clearTimeout(t)
  }, [changedIdx, votes])

  const total = votes.reduce((s, v) => s + v, 0)
  const maxVote = Math.max(...votes)

  return (
    <div className="relative max-w-md">
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-violet-500/10 rounded-3xl blur-2xl" />

      <div className="relative bg-white/[0.06] backdrop-blur-md border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[13px] font-medium text-white/40 uppercase tracking-wider">
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
            <span className="text-xs text-white/40 font-medium">{total} votes</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {POLL_OPTIONS.map((opt, i) => {
            const pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0
            const barWidth = maxVote > 0 ? Math.round((votes[i] / maxVote) * 100) : 0
            const isLeading = votes[i] === maxVote
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
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex -space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-[#0a0a12] bg-gradient-to-br from-violet-400 to-indigo-500"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-[#0a0a12] bg-white/10 flex items-center justify-center">
              <span className="text-[8px] text-white/60 font-medium">+{total - 5}</span>
            </div>
          </div>
          <span className="text-[11px] text-white/30">
            Updates in real-time
          </span>
        </div>
      </div>
    </div>
  )
}
