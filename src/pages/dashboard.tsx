import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useAuth } from '@/contexts/auth-context'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import {
  Plus,
  Trash2,
  Play,
  Copy,
  Presentation,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Search,
  X,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, cn } from '@/lib/utils'
import { CreateSessionDialog } from '@/components/create-session-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    dot: 'bg-muted-foreground',
  },
  active: {
    label: 'Live',
    dot: 'bg-green-500',
  },
  ended: {
    label: 'Ended',
    dot: 'bg-muted-foreground/50',
  },
}

const STATUS_FILTERS = ['all', 'draft', 'active', 'ended'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  draft: 'Drafts',
  active: 'Live',
  ended: 'Ended',
}

interface Session {
  _id: string
  _creationTime: number
  title: string
  code: string
  status: 'draft' | 'active' | 'ended'
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsStringLiteral(STATUS_FILTERS).withDefault('all')
  )

  const sessions = useQuery(api.sessions.listByPresenter, {
    presenterId: user?.id ?? '',
  })

  const deleteSession = useMutation(api.sessions.remove)
  const duplicateSession = useMutation(api.sessions.duplicate)

  const [deletingSession, setDeletingSession] = useState<{
    id: string
    title: string
    stats?: { questionCount: number; participantCount: number; responseCount: number }
  } | null>(null)

  const filteredSessions = useMemo(() => {
    if (!sessions) return undefined
    return sessions.filter((session) => {
      if (statusFilter !== 'all' && session.status !== statusFilter) return false
      if (search && !session.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [sessions, search, statusFilter])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const handleDelete = async (sessionId: string) => {
    try {
      await deleteSession({ sessionId: sessionId as Id<'sessions'> })
      toast.success('Session deleted')
      setDeletingSession(null)
    } catch (err) {
      toast.error('Failed to delete session')
      console.error(err)
    }
  }

  const handleDuplicate = async (sessionId: string) => {
    try {
      const result = await duplicateSession({ sessionId: sessionId as Id<'sessions'> })
      toast.success('Session duplicated')
      navigate(`/session/${result.sessionId}`)
    } catch (err) {
      toast.error('Failed to duplicate session')
      console.error(err)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Join code copied!')
  }

  const copyUrl = (code: string) => {
    const url = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(url)
    toast.success('Join URL copied!')
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold text-foreground">Sessions</h1>
          {sessions && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {sessions.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search — only when sessions exist */}
          {sessions && sessions.length > 0 && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value || '')}
                placeholder="Search..."
                className="h-7 w-44 pl-8 pr-7 text-xs border-transparent bg-muted/50 focus:border-border focus:bg-background"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          {/* Status filters */}
          {sessions && sessions.length > 0 && (
            <div className="hidden sm:flex items-center gap-0.5 rounded-md bg-muted/50 p-0.5">
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded transition-all',
                    statusFilter === status
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {STATUS_FILTER_LABELS[status]}
                </button>
              ))}
            </div>
          )}

          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="h-7 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Session
          </Button>
        </div>
      </div>

      {/* Mobile search & filters */}
      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-2 mb-4 sm:hidden">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value || '')}
              placeholder="Search..."
              className="h-8 pl-8 pr-7 text-xs border-transparent bg-muted/50 focus:border-border focus:bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-0.5 rounded-md bg-muted/50 p-0.5">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'flex-1 px-2 py-1 text-xs font-medium rounded transition-all text-center',
                  statusFilter === status
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {STATUS_FILTER_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create session dialog */}
      <CreateSessionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Sessions list */}
      {sessions === undefined ? (
        /* Skeleton loading — row-shaped */
        <div className="rounded-lg border divide-y animate-in fade-in-0 duration-200">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-2 w-2 rounded-full shrink-0" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-16 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-3 ml-auto">
                <Skeleton className="h-3.5 w-10" />
                <Skeleton className="h-3.5 w-10" />
                <Skeleton className="h-3.5 w-10" />
              </div>
              <Skeleton className="h-3.5 w-12 ml-auto sm:ml-0" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        /* Empty state — no sessions at all */
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in-0 duration-300">
          <Presentation className="w-8 h-8 text-muted-foreground/60 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No sessions yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create your first session to get started.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="h-7 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Session
          </Button>
        </div>
      ) : filteredSessions && filteredSessions.length === 0 ? (
        /* Empty state — filters yielded nothing */
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in-0 duration-300">
          <Search className="w-8 h-8 text-muted-foreground/60 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No matching sessions</p>
          <p className="text-xs text-muted-foreground mb-4">
            Try adjusting your search or filters.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1.5">
            <X className="w-3 h-3" />
            Clear filters
          </Button>
        </div>
      ) : (
        /* Session rows */
        <div className="rounded-lg border animate-in fade-in-0 duration-200">
          <div className="divide-y">
            {(filteredSessions ?? sessions).map((session) => (
              <SessionRow
                key={session._id}
                session={session}
                onNavigate={(path) => navigate(path)}
                onDelete={(stats) => setDeletingSession({ id: session._id, title: session.title, stats })}
                onDuplicate={() => handleDuplicate(session._id)}
                onCopyCode={() => copyCode(session.code)}
                onCopyUrl={() => copyUrl(session.code)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete session confirmation */}
      <AlertDialog
        open={!!deletingSession}
        onOpenChange={(open) => {
          if (!open) setDeletingSession(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deletingSession?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session
              {deletingSession?.stats && (
                <>
                  , including{' '}
                  <span className="font-semibold text-foreground">{deletingSession.stats.questionCount}</span> question{deletingSession.stats.questionCount !== 1 ? 's' : ''},
                  {' '}<span className="font-semibold text-foreground">{deletingSession.stats.participantCount}</span> participant{deletingSession.stats.participantCount !== 1 ? 's' : ''},
                  {' '}and <span className="font-semibold text-foreground">{deletingSession.stats.responseCount}</span> response{deletingSession.stats.responseCount !== 1 ? 's' : ''}
                </>
              )}
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingSession) handleDelete(deletingSession.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface SessionRowProps {
  session: Session
  onNavigate: (path: string) => void
  onDelete: (stats?: { questionCount: number; participantCount: number; responseCount: number }) => void
  onDuplicate: () => void
  onCopyCode: () => void
  onCopyUrl: () => void
}

function SessionRow({ session, onNavigate, onDelete, onDuplicate, onCopyCode, onCopyUrl }: SessionRowProps) {
  const stats = useQuery(api.sessions.getStats, {
    sessionId: session._id as Id<'sessions'>,
  })

  const statusConfig = STATUS_CONFIG[session.status]
  const isLive = session.status === 'active'

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50',
        isLive && 'bg-green-500/[0.03]'
      )}
      onClick={() => onNavigate(`/session/${session._id}`)}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center gap-4 w-full">
        {/* Status dot */}
        <span
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            statusConfig.dot,
            isLive && 'animate-pulse'
          )}
        />

        {/* Title */}
        <span className="text-sm font-medium text-foreground truncate min-w-0 flex-1">
          {session.title}
        </span>

        {isLive && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 shrink-0">
            Live
          </span>
        )}

        {/* Right-side metadata */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Stats */}
          {stats === undefined ? (
            <Skeleton className="h-3 w-16" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] text-muted-foreground tabular-nums tracking-wide">
                  {stats.questionCount}
                  <span className="text-muted-foreground/50 mx-1.5">/</span>
                  {stats.participantCount}
                  <span className="text-muted-foreground/50 mx-1.5">/</span>
                  {stats.responseCount}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {stats.questionCount} question{stats.questionCount !== 1 ? 's' : ''} · {stats.participantCount} participant{stats.participantCount !== 1 ? 's' : ''} · {stats.responseCount} response{stats.responseCount !== 1 ? 's' : ''}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Code */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyCode()
                }}
                className="font-mono text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors w-14 text-right"
              >
                {session.code}
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to copy</TooltipContent>
          </Tooltip>

          {/* Time */}
          <span className="text-[11px] text-muted-foreground/60 w-14 text-right">
            {timeAgo(session._creationTime)}
          </span>

          {/* Actions */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onNavigate(`/session/${session._id}`)}>
                <Pencil className="w-4 h-4" />
                Edit session
              </DropdownMenuItem>
              {session.status !== 'ended' && (
                <DropdownMenuItem onClick={() => onNavigate(`/present/${session._id}`)}>
                  <Play className="w-4 h-4" />
                  Present
                </DropdownMenuItem>
              )}
              {session.status !== 'draft' && (
                <DropdownMenuItem onClick={() => onNavigate(`/session/${session._id}/analytics`)}>
                  <BarChart3 className="w-4 h-4" />
                  View analytics
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onCopyCode}>
                <Copy className="w-4 h-4" />
                Copy join code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyUrl}>
                <ExternalLink className="w-4 h-4" />
                Copy join URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(stats ?? undefined)}
              >
                <Trash2 className="w-4 h-4" />
                Delete session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex sm:hidden items-center gap-3 w-full">
        <span
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            statusConfig.dot,
            isLive && 'animate-pulse'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {session.title}
            </span>
            {isLive && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 shrink-0">
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-[11px] text-muted-foreground">{session.code}</span>
            <span className="text-[11px] text-muted-foreground/50">·</span>
            <span className="text-[11px] text-muted-foreground">{timeAgo(session._creationTime)}</span>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onNavigate(`/session/${session._id}`)}>
                <Pencil className="w-4 h-4" />
                Edit session
              </DropdownMenuItem>
              {session.status !== 'ended' && (
                <DropdownMenuItem onClick={() => onNavigate(`/present/${session._id}`)}>
                  <Play className="w-4 h-4" />
                  Present
                </DropdownMenuItem>
              )}
              {session.status !== 'draft' && (
                <DropdownMenuItem onClick={() => onNavigate(`/session/${session._id}/analytics`)}>
                  <BarChart3 className="w-4 h-4" />
                  View analytics
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onCopyCode}>
                <Copy className="w-4 h-4" />
                Copy join code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyUrl}>
                <ExternalLink className="w-4 h-4" />
                Copy join URL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(stats ?? undefined)}
              >
                <Trash2 className="w-4 h-4" />
                Delete session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
