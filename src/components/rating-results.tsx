import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaitingForResponses } from './waiting-for-responses'

interface RatingResultsProps {
  counts: Record<string, number>
  total: number
  /** sm = compact (monitor mockup), lg = full size (editor / results page) */
  size?: 'sm' | 'lg'
}

/* Warm semantic color scale: 5★ gold → 1★ deep amber */
const RATING_COLORS: Record<number, string> = {
  5: '#f59e0b', // amber-500 — gold
  4: '#d97706', // amber-600
  3: '#b45309', // amber-700
  2: '#92400e', // amber-800
  1: '#78350f', // amber-900
}

export function RatingResults({ counts, total, size = 'lg' }: RatingResultsProps) {
  const sm = size === 'sm'

  if (total === 0) {
    return <WaitingForResponses size={size} />
  }

  let sum = 0
  for (let i = 1; i <= 5; i++) sum += i * (counts[String(i)] ?? 0)
  const avg = total > 0 ? (sum / total).toFixed(1) : '0'
  const avgNum = Number(avg)
  const maxCount = Math.max(...[1, 2, 3, 4, 5].map((s) => counts[String(s)] ?? 0), 1)

  if (sm) {
    return (
      <div className="w-full flex flex-col items-center gap-3">
        {/* ── Hero: giant stars ── */}
        <div className="flex items-center justify-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= Math.round(avgNum)
            return (
              <Star
                key={star}
                className={cn(
                  'w-7 h-7 transition-colors',
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/15'
                )}
                style={filled ? { filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))' } : undefined}
              />
            )
          })}
        </div>
        {/* Score underneath */}
        <div className="text-center -mt-1">
          <span className="font-bold text-foreground tabular-nums text-3xl leading-none">{avg}</span>
          <span className="text-muted-foreground/50 text-xs ml-1">/ 5</span>
        </div>
        {/* Distribution — card-style rows */}
        <div className="w-full space-y-0.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = counts[String(star)] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const barWidth = (count / maxCount) * 100
            const isTop = count === maxCount && count > 0
            const isEmpty = count === 0
            const color = RATING_COLORS[star]

            return (
              <div
                key={star}
                className={cn(
                  'rounded-md transition-all duration-500',
                  'px-2 py-1',
                  isEmpty && 'opacity-30',
                  isTop && 'bg-white/[0.05] ring-1 ring-white/[0.08]'
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className={cn(
                      'font-medium tabular-nums text-[10px]',
                      isEmpty ? 'text-muted-foreground/40' : 'text-foreground/80'
                    )}>
                      {star}
                    </span>
                    <Star
                      className={cn(
                        'w-2.5 h-2.5',
                        isEmpty
                          ? 'fill-muted-foreground/20 text-muted-foreground/20'
                          : 'fill-amber-400 text-amber-400'
                      )}
                    />
                  </div>
                  <span className="flex-1" />
                  <span className={cn(
                    'text-[9px] tabular-nums font-semibold',
                    isEmpty
                      ? 'text-muted-foreground/20'
                      : isTop
                        ? 'text-foreground'
                        : 'text-foreground/80'
                  )}>
                    {pct}%
                  </span>
                </div>
                <div className="rounded-full overflow-hidden h-[2px] bg-white/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: color,
                      opacity: isEmpty ? 0 : 0.9,
                      boxShadow: isTop ? `0 0 8px ${color}40` : 'none',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  //  Large layout: 50/50 split — stars+score left, distribution right
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="w-full flex items-center gap-0">
      {/* ── Left 50%: Hero stars + score ── */}
      <div className="w-1/2 flex justify-center flex-shrink-0">
        <div className="flex flex-col items-center">
          {/* Giant glowing stars — the hero */}
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= Math.round(avgNum)
              return (
                <Star
                  key={star}
                  className={cn(
                    'transition-colors',
                    filled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/10'
                  )}
                  style={{
                    width: 52,
                    height: 52,
                    ...(filled
                      ? { filter: 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.5)) drop-shadow(0 0 4px rgba(245, 158, 11, 0.3))' }
                      : {}),
                  }}
                />
              )
            })}
          </div>

          {/* Score below stars */}
          <div className="flex items-baseline gap-2 mt-6">
            <span
              className="font-bold text-foreground tabular-nums leading-none"
              style={{ fontSize: '5.5rem' }}
            >
              {avg}
            </span>
            <span className="text-muted-foreground/40 text-2xl font-medium">/ 5</span>
          </div>

          {/* Response count */}
          <span className="text-sm text-muted-foreground/40 mt-3 tabular-nums tracking-wide">
            {total} response{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Right 50%: Distribution bars ── */}
      <div className="w-1/2 min-w-0 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[String(star)] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const barWidth = (count / maxCount) * 100
          const isTop = count === maxCount && count > 0
          const isEmpty = count === 0
          const color = RATING_COLORS[star]

          return (
            <div
              key={star}
              className={cn(
                'rounded-lg transition-all duration-500',
                'px-4 py-2.5',
                isEmpty && 'opacity-30',
                isTop && 'bg-white/[0.05] ring-1 ring-white/[0.08]'
              )}
            >
              {/* Label row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={cn(
                    'font-semibold tabular-nums text-base',
                    isEmpty ? 'text-muted-foreground/40' : 'text-foreground/80'
                  )}>
                    {star}
                  </span>
                  <Star
                    className={cn(
                      'w-4 h-4',
                      isEmpty
                        ? 'fill-muted-foreground/20 text-muted-foreground/20'
                        : 'fill-amber-400 text-amber-400'
                    )}
                  />
                </div>
                <span className="flex-1" />
                <span className={cn(
                  'tabular-nums text-sm',
                  isEmpty ? 'text-muted-foreground/20' : 'text-muted-foreground/50'
                )}>
                  {count}
                </span>
                <span className={cn(
                  'tabular-nums font-semibold text-base flex-shrink-0 w-14 text-right',
                  isEmpty
                    ? 'text-muted-foreground/20'
                    : isTop
                      ? 'text-foreground'
                      : 'text-foreground/80'
                )}>
                  {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="rounded-full overflow-hidden h-[6px] bg-white/[0.04]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                    opacity: isEmpty ? 0 : 0.9,
                    boxShadow: isTop ? `0 0 12px ${color}50` : 'none',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
