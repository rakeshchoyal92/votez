import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useAuth } from '@/contexts/auth-context'
import {
  Plus,
  Trash2,
  Play,
  Copy,
  Loader2,
  Presentation,
  MoreHorizontal,
  Users,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { timeAgo, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
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
    variant: 'secondary' as const,
    dot: 'bg-muted-foreground',
    cardClass: ''
  },
  active: {
    label: 'Live',
    variant: 'success' as const,
    dot: 'bg-green-500',
    cardClass: 'border-green-500/30 shadow-green-500/10 shadow-lg'
  },
  ended: {
    label: 'Ended',
    variant: 'outline' as const,
    dot: 'bg-muted-foreground/50',
    cardClass: 'opacity-75'
  },
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
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const sessions = useQuery(api.sessions.listByPresenter, {
    presenterId: user?.id ?? '',
  })

  const createSession = useMutation(api.sessions.create)
  const deleteSession = useMutation(api.sessions.remove)
  const duplicateSession = useMutation(api.sessions.duplicate)

  const [deletingSession, setDeletingSession] = useState<{
    id: string
    title: string
    stats?: { questionCount: number; participantCount: number; responseCount: number }
  } | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !user) return

    try {
      const result = await createSession({
        title: newTitle.trim(),
        presenterId: user.id,
        presenterName: user.user_metadata?.full_name ?? user.email ?? 'Presenter',
      })
      setNewTitle('')
      setIsCreating(false)
      navigate(`/session/${result.sessionId}`)
    } catch (err) {
      toast.error('Failed to create session')
      console.error(err)
    }
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
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your polling sessions
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="shadow-sm gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Session
        </Button>
      </div>

      {/* Create form */}
      {isCreating && (
        <Card className="mb-6 animate-in slide-in-from-top-2 duration-200 border-primary/20">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 p-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Session title (e.g., Team Retrospective)"
              autoFocus
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={!newTitle.trim()} className="flex-1 sm:flex-none">
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false)
                  setNewTitle('')
                }}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Sessions grid */}
      {sessions === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-16 sm:py-24 px-6 animate-in fade-in-0 duration-300">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
              <Presentation className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1.5">
            No sessions yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
            Create your first polling session and start engaging your audience in real-time.
          </p>
          <Button onClick={() => setIsCreating(true)} className="shadow-sm gap-2">
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-0 duration-300">
          {sessions.map((session) => (
            <SessionCard
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

interface SessionCardProps {
  session: Session
  onNavigate: (path: string) => void
  onDelete: (stats?: { questionCount: number; participantCount: number; responseCount: number }) => void
  onDuplicate: () => void
  onCopyCode: () => void
  onCopyUrl: () => void
}

function SessionCard({ session, onNavigate, onDelete, onDuplicate, onCopyCode, onCopyUrl }: SessionCardProps) {
  const stats = useQuery(api.sessions.getStats, {
    sessionId: session._id as Id<'sessions'>,
  })

  const statusConfig = STATUS_CONFIG[session.status]

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-150 hover:shadow-md hover:border-border cursor-pointer",
        statusConfig.cardClass,
        session.status === 'active' && "animate-pulse-border"
      )}
      onClick={() => onNavigate(`/session/${session._id}`)}
    >
      {/* Pulse animation for live sessions */}
      {session.status === 'active' && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg truncate mb-1.5 group-hover:text-primary transition-colors">
              {session.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusConfig.variant} className="gap-1.5 font-normal">
                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot, session.status === 'active' && "animate-pulse")} />
                {statusConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {timeAgo(session._creationTime)}
              </span>
            </div>
          </div>

          {/* Actions dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* Join code */}
        <div className="mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyCode()
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/code"
              >
                <span className="text-[11px] font-medium uppercase tracking-wider">Join Code</span>
                <span className="font-mono text-base font-bold text-foreground tracking-widest">
                  {session.code}
                </span>
                <Copy className="w-3 h-3 opacity-0 group-hover/code:opacity-100 transition-opacity" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to copy join code</TooltipContent>
          </Tooltip>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          {stats === undefined ? (
            <>
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="font-medium tabular-nums">{stats.questionCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.questionCount} question{stats.questionCount !== 1 ? 's' : ''}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span className="font-medium tabular-nums">{stats.participantCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.participantCount} participant{stats.participantCount !== 1 ? 's' : ''}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="font-medium tabular-nums">{stats.responseCount}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.responseCount} response{stats.responseCount !== 1 ? 's' : ''}</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Action button */}
        <Button
          variant={session.status === 'ended' ? 'outline' : 'default'}
          size="sm"
          className="w-full gap-2 transition-all"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(session.status === 'ended' ? `/session/${session._id}` : `/present/${session._id}`)
          }}
        >
          {session.status === 'ended' ? (
            <>
              <Pencil className="w-3.5 h-3.5" />
              View Session
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Present
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
