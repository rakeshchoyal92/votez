import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { WaitingForResponses } from './waiting-for-responses'

interface OpenEndedResultsProps {
  counts: Record<string, number>
  total: number
  /** sm = compact (monitor mockup, max 6 items), lg = full size (results page) */
  size?: 'sm' | 'lg'
}

export function OpenEndedResults({ counts, total, size = 'lg' }: OpenEndedResultsProps) {
  const sm = size === 'sm'

  if (total === 0) {
    return <WaitingForResponses size={size} />
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
