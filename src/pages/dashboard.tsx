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
  Users,
  MessageSquare,
  Radio,
  FileText,
  Zap,
  Hash,
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
    dot: 'bg-muted-foreground/60',
    badge: 'bg-muted text-muted-foreground',
  },
  active: {
    label: 'Live',
    dot: 'bg-green-500',
    badge: 'bg-green-500/15 text-green-600 dark:text-green-400',
  },
  ended: {
    label: 'Ended',
    dot: 'bg-muted-foreground/40',
    badge: 'bg-muted text-muted-foreground/70',
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

  const dashboardStats = useQuery(api.sessions.getDashboardStats, {
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

  const statusCounts = useMemo(() => {
    if (!sessions) return { all: 0, draft: 0, active: 0, ended: 0 }
    return {
      all: sessions.length,
      draft: sessions.filter((s) => s.status === 'draft').length,
      active: sessions.filter((s) => s.status === 'active').length,
      ended: sessions.filter((s) => s.status === 'ended').length,
    }
  }, [sessions])

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

  const hasAnySessions = sessions && sessions.length > 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Sessions</h1>
          {sessions && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Stats overview */}
      {hasAnySessions && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            label="Total Sessions"
            value={dashboardStats?.totalSessions}
            icon={<FileText className="w-4 h-4" />}
          />
          <StatsCard
            label="Live Now"
            value={dashboardStats?.liveCount}
            icon={<Radio className="w-4 h-4" />}
            highlight={!!dashboardStats?.liveCount && dashboardStats.liveCount > 0}
          />
          <StatsCard
            label="Participants"
            value={dashboardStats?.totalParticipants}
            icon={<Users className="w-4 h-4" />}
          />
          <StatsCard
            label="Responses"
            value={dashboardStats?.totalResponses}
            icon={<MessageSquare className="w-4 h-4" />}
          />
        </div>
      )}

      {/* Search & filter bar */}
      {hasAnySessions && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value || '')}
              placeholder="Search sessions..."
              className="h-9 pl-9 pr-8 bg-muted/40 border-transparent focus:border-border focus:bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
            {STATUS_FILTERS.map((status) => {
              const count = statusCounts[status]
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5',
                    statusFilter === status
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {STATUS_FILTER_LABELS[status]}
                  {sessions && (
                    <span
                      className={cn(
                        'tabular-nums text-[10px]',
                        statusFilter === status ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <CreateSessionDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Session list */}
      {sessions === undefined ? (
        <div className="space-y-2 animate-in fade-in-0 duration-200">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-48" />
                <div className="hidden sm:flex items-center gap-4 ml-auto">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in-0 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Presentation className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-1.5">No sessions yet</p>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
            Create your first interactive session and start engaging your audience in real-time.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Session
          </Button>
        </div>
      ) : filteredSessions && filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in-0 duration-300">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-1.5">No matching sessions</p>
          <p className="text-sm text-muted-foreground mb-6">
            Try adjusting your search or filters.
          </p>
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="w-3.5 h-3.5" />
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-2 animate-in fade-in-0 duration-200">
          {(filteredSessions ?? sessions).map((session) => (
            <SessionRow
              key={session._id}
              session={session}
              onNavigate={(path) => navigate(path)}
              onDelete={(stats) =>
                setDeletingSession({ id: session._id, title: session.title, stats })
              }
              onDuplicate={() => handleDuplicate(session._id)}
              onCopyCode={() => copyCode(session.code)}
              onCopyUrl={() => copyUrl(session.code)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
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
                  <span className="font-semibold text-foreground">
                    {deletingSession.stats.questionCount}
                  </span>{' '}
                  question{deletingSession.stats.questionCount !== 1 ? 's' : ''},{' '}
                  <span className="font-semibold text-foreground">
                    {deletingSession.stats.participantCount}
                  </span>{' '}
                  participant{deletingSession.stats.participantCount !== 1 ? 's' : ''}, and{' '}
                  <span className="font-semibold text-foreground">
                    {deletingSession.stats.responseCount}
                  </span>{' '}
                  response{deletingSession.stats.responseCount !== 1 ? 's' : ''}
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

/* ─── Stats Card ──────────────────────────────────────────────────────── */

function StatsCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string
  value: number | undefined
  icon: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 transition-colors',
        highlight && 'border-green-500/30 bg-green-500/[0.04]'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn('text-muted-foreground/60', highlight && 'text-green-500')}>
          {icon}
        </span>
      </div>
      {value === undefined ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <span
          className={cn(
            'text-2xl font-semibold tabular-nums tracking-tight',
            highlight && value > 0 && 'text-green-600 dark:text-green-400'
          )}
        >
          {value.toLocaleString()}
        </span>
      )}
    </div>
  )
}

/* ─── Session Row ─────────────────────────────────────────────────────── */

interface SessionRowProps {
  session: Session
  onNavigate: (path: string) => void
  onDelete: (stats?: {
    questionCount: number
    participantCount: number
    responseCount: number
  }) => void
  onDuplicate: () => void
  onCopyCode: () => void
  onCopyUrl: () => void
}

function SessionRow({
  session,
  onNavigate,
  onDelete,
  onDuplicate,
  onCopyCode,
  onCopyUrl,
}: SessionRowProps) {
  const stats = useQuery(api.sessions.getStats, {
    sessionId: session._id as Id<'sessions'>,
  })

  const statusConfig = STATUS_CONFIG[session.status]
  const isLive = session.status === 'active'

  const actionsMenu = (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
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
            <DropdownMenuItem
              onClick={() => onNavigate(`/session/${session._id}/analytics`)}
            >
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
  )

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card cursor-pointer transition-all hover:shadow-sm hover:border-border',
        isLive && 'border-green-500/25 hover:border-green-500/40'
      )}
      onClick={() => onNavigate(`/session/${session._id}`)}
    >
      {isLive && (
        <div className="absolute inset-0 rounded-xl bg-green-500/[0.03] pointer-events-none" />
      )}

      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-4 px-5 py-4 relative">
        {/* Status badge */}
        <div
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0',
            statusConfig.badge
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              statusConfig.dot,
              isLive && 'animate-pulse'
            )}
          />
          {statusConfig.label}
        </div>

        {/* Title */}
        <span className="text-sm font-medium text-foreground truncate min-w-0 flex-1">
          {session.title}
        </span>

        {/* Stats */}
        <div className="flex items-center gap-4 shrink-0">
          {stats === undefined ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <div className="flex items-center gap-3.5 text-xs text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Zap className="w-3 h-3 text-muted-foreground/50" />
                    {stats.questionCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {stats.questionCount} question{stats.questionCount !== 1 ? 's' : ''}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Users className="w-3 h-3 text-muted-foreground/50" />
                    {stats.participantCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {stats.participantCount} participant
                  {stats.participantCount !== 1 ? 's' : ''}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 tabular-nums">
                    <MessageSquare className="w-3 h-3 text-muted-foreground/50" />
                    {stats.responseCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {stats.responseCount} response{stats.responseCount !== 1 ? 's' : ''}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Code badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyCode()
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Hash className="w-3 h-3 text-muted-foreground/40" />
                {session.code}
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to copy join code</TooltipContent>
          </Tooltip>

          {/* Time */}
          <span className="text-xs text-muted-foreground/60 w-16 text-right tabular-nums">
            {timeAgo(session._creationTime)}
          </span>

          {actionsMenu}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden items-start gap-3 px-4 py-3.5 relative">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0',
                statusConfig.badge
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  statusConfig.dot,
                  isLive && 'animate-pulse'
                )}
              />
              {statusConfig.label}
            </div>
          </div>
          <span className="text-sm font-medium text-foreground line-clamp-1">
            {session.title}
          </span>
          <div className="flex items-center gap-2.5 mt-1.5 text-xs text-muted-foreground">
            <span className="font-mono text-[11px]">{session.code}</span>
            <span className="text-muted-foreground/30">&middot;</span>
            <span>{timeAgo(session._creationTime)}</span>
            {stats && (
              <>
                <span className="text-muted-foreground/30">&middot;</span>
                <span className="tabular-nums">
                  {stats.questionCount}Q &middot; {stats.participantCount}P &middot;{' '}
                  {stats.responseCount}R
                </span>
              </>
            )}
          </div>
        </div>
        {actionsMenu}
      </div>
    </div>
  )
}
