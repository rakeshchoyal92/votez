import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface OpenEndedResultsProps {
  counts: Record<string, number>
  total: number
  /** sm = compact (monitor mockup, max 6 items), lg = full size (results page) */
  size?: 'sm' | 'lg'
}

export function OpenEndedResults({ counts, total, size = 'lg' }: OpenEndedResultsProps) {
  const sm = size === 'sm'

  if (total === 0) {
    const rowWidths = sm ? ['75%', '55%', '65%', '45%'] : ['80%', '55%', '70%', '45%']
    return (
      <div className={cn('mx-auto', sm ? 'py-8 max-w-md' : 'py-10 max-w-lg')}>
        <div className={cn('space-y-3', sm && 'space-y-2')}>
          {rowWidths.map((w, i) => (
            <div
              key={i}
              className={cn(
                'relative flex items-center rounded-lg overflow-hidden',
                sm ? 'h-10' : 'h-12'
              )}
              style={{ width: w }}
            >
              {/* Left-edge accent glow */}
              <div
                className="absolute inset-y-0 left-0 w-[2px] bg-foreground/30 animate-hud-glow-line"
                style={{ animationDelay: `${i * 300}ms` }}
              />

              {/* Base row */}
              <div
                className="absolute inset-0 bg-foreground/[0.25] animate-hud-breathe"
                style={{ animationDelay: `${i * 400}ms` }}
              />

              {/* Blinking cursor on first row */}
              {i === 0 && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[2px] h-[55%] bg-foreground/50 animate-hud-cursor-blink" />
              )}
            </div>
          ))}
        </div>
        <p className={cn('text-center text-muted-foreground/80 mt-5', sm ? 'text-xs' : 'text-sm', 'animate-hud-breathe')}>
          Waiting for responses...
        </p>
      </div>
    )
  }

  const entries = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, sm ? 6 : undefined)

  return (
    <div
      className={cn(
        'mx-auto',
        sm ? 'space-y-1.5 max-w-md' : 'space-y-2.5 max-h-96 overflow-auto'
      )}
    >
      {entries.map(([answer, count], i) => (
        <div
          key={i}
          className={cn(
            'flex items-start justify-between gap-4 bg-muted/40 rounded-lg',
            sm ? 'px-3 py-2' : 'px-4 py-3 hover:bg-muted/60 transition-colors'
          )}
        >
          <span
            className={cn(
              'text-foreground flex-1 leading-relaxed',
              sm ? 'text-sm' : 'text-sm'
            )}
          >
            {answer}
          </span>
          {count > 1 &&
            (sm ? (
              <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                x{count}
              </span>
            ) : (
              <Badge
                variant="secondary"
                className="font-normal text-xs tabular-nums flex-shrink-0"
              >
                x{count}
              </Badge>
            ))}
        </div>
      ))}
    </div>
  )
}
