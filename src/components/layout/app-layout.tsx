import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { LayoutDashboard, Settings, Moon, Sun, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileHeader } from '@/components/layout/mobile-header'
import { ContentHeader } from '@/components/layout/content-header'
import { Logo } from '@/components/layout/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

const NAV_ITEMS = [
  { label: 'Sessions', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const userName = user?.user_metadata?.full_name ?? user?.email ?? ''
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/session/')
    }
    return location.pathname === href
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop icon rail */}
        <Sidebar />

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col [&>button]:hidden">
            <div className="h-14 flex items-center border-b border-border/60 px-5 shrink-0">
              <Logo to="/dashboard" size="sm" />
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      navigate(item.href)
                      setMobileOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mb-0.5',
                      active
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
            <div className="shrink-0 border-t border-border/60 p-3 space-y-1">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <div className="relative h-[18px] w-[18px]">
                  <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute inset-0 h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
                <span>Theme</span>
              </button>
              <Separator className="!my-2" />
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="h-7 w-7 ring-1 ring-border">
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate flex-1">{userName}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-destructive transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>Sign out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
          <ContentHeader />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
