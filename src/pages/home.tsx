import { useState } from 'react'
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Nav */}
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

        {/* Everything centered */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16">
          <div className="max-w-2xl mx-auto text-center space-y-10">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[0.95]">
                Live polls,
                <br />
                zero friction.
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Create polls in seconds. No app downloads,
                no sign-ups for voters.
              </p>
            </div>

            <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
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
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 text-center">
          <span className="text-sm text-muted-foreground">
            Built for presenters & teams
          </span>
        </footer>
      </div>
    </TooltipProvider>
  )
}
