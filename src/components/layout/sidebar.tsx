import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { LayoutDashboard, Settings, Moon, Sun, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Logo } from '@/components/layout/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const NAV_ITEMS = [
  { label: 'Sessions', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const userName = user?.user_metadata?.full_name ?? user?.email ?? ''
  const userEmail = user?.email ?? ''
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
    <aside className="hidden lg:flex flex-col items-center w-[52px] sticky top-0 h-screen border-r border-border/60 bg-background py-3 gap-1">
      {/* Logo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-3 flex items-center justify-center"
          >
            <Logo size="sm" className="[&>span]:hidden" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Home</TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="w-6 h-px bg-border/60 mb-2" />

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(item.href)}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        )
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Toggle theme</TooltipContent>
      </Tooltip>

      {/* User */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent/50 transition-colors">
                <Avatar className="h-7 w-7 ring-1 ring-border">
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{userName}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent side="right" align="end" className="w-56" sideOffset={8}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userName}</p>
              {userEmail && userName !== userEmail && (
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  )
}
