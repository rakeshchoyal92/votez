import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ChevronRight } from 'lucide-react'

export function ContentHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  const session = useQuery(
    api.sessions.get,
    sessionId ? { sessionId: sessionId as Id<'sessions'> } : 'skip'
  )

  const breadcrumbs = getBreadcrumbs(location.pathname, session?.title)

  return (
    <header className="sticky top-0 z-40 flex items-center h-12 border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 px-6">
      <nav className="flex items-center gap-1.5 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1
          return (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
              )}
              {crumb.href && !isLast ? (
                <button
                  onClick={() => navigate(crumb.href!)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground font-medium truncate">
                  {crumb.label}
                </span>
              )}
            </span>
          )
        })}
      </nav>
    </header>
  )
}

interface Breadcrumb {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string, sessionTitle?: string): Breadcrumb[] {
  if (pathname.startsWith('/session/')) {
    return [
      { label: 'Sessions', href: '/dashboard' },
      { label: sessionTitle ?? 'Loading...' },
    ]
  }

  if (pathname === '/dashboard') {
    return [{ label: 'Sessions' }]
  }

  if (pathname === '/settings') {
    return [{ label: 'Settings' }]
  }

  return []
}
