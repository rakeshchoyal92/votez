import { ArrowLeft, Pencil, Play } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface SessionHeaderProps {
  title: string
  isEditable: boolean
  isLive: boolean
  isEnded: boolean
  editingTitle: boolean
  titleDraft: string
  statusConfig: { label: string; variant: 'secondary' | 'success' | 'outline'; dot: string }
  onEditTitle: () => void
  onTitleChange: (val: string) => void
  onSaveTitle: () => void
}

export function SessionHeader({
  title,
  isEditable,
  isLive,
  isEnded,
  editingTitle,
  titleDraft,
  statusConfig,
  onEditTitle,
  onTitleChange,
  onSaveTitle,
}: SessionHeaderProps) {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  return (
    <>
      {/* Back link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/dashboard')}
        className="text-muted-foreground hover:text-foreground -ml-2 mb-4 gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Sessions
      </Button>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {editingTitle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  onSaveTitle()
                }}
                className="flex-1"
              >
                <Input
                  value={titleDraft}
                  onChange={(e) => onTitleChange(e.target.value)}
                  autoFocus
                  className="text-2xl font-bold h-auto py-2 border-primary"
                  onBlur={onSaveTitle}
                />
              </form>
            ) : (
              <h1
                className={cn(
                  'text-2xl sm:text-3xl font-bold text-foreground truncate group',
                  isEditable && 'cursor-pointer hover:text-primary transition-colors'
                )}
                onClick={onEditTitle}
              >
                {title}
                {isEditable && (
                  <Pencil className="inline w-4 h-4 ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </h1>
            )}
            <Badge variant={statusConfig.variant} className="gap-1.5 flex-shrink-0">
              <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot, isLive && 'animate-pulse')} />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Present button — only for draft/active */}
          {!isEnded && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate(`/present/${sessionId}`)}
                className="shadow-sm gap-2 flex-1 sm:flex-none"
              >
                <Play className="w-4 h-4" />
                Present
              </Button>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-sm text-muted-foreground">
          {isEditable
            ? 'Build your questions, then share the code with your audience'
            : isLive
              ? 'Session is live — questions are locked'
              : 'Session has ended — view your results below'}
        </p>
      </div>
    </>
  )
}
