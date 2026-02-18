import { Star } from 'lucide-react'
import { cn, getChartColor } from '@/lib/utils'

interface RatingResultsProps {
  counts: Record<string, number>
  total: number
  /** sm = compact (monitor mockup), lg = full size (editor / results page) */
  size?: 'sm' | 'lg'
}

export function RatingResults({ counts, total, size = 'lg' }: RatingResultsProps) {
  const sm = size === 'sm'

  if (total === 0) {
    const ghostBarWidths = [30, 20, 50, 35, 70]
    return (
      <div className={cn('mx-auto', sm ? 'space-y-4 max-w-xs' : 'space-y-6 max-w-md')}>
        {/* Ghost average display */}
        <div className={cn('text-center', !sm && 'py-4')}>
          <div className={cn('inline-flex items-baseline', sm ? 'gap-1.5' : 'gap-2 mb-3')}>
            <span className={cn('font-bold text-foreground/[0.40] tabular-nums', sm ? 'text-4xl' : 'text-5xl')}>
              &mdash;
            </span>
          </div>

          {/* Scanning star wave */}
          <div className={cn('flex items-center justify-center', sm ? 'gap-0.5 mt-1' : 'gap-1')}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  'animate-hud-star-scan text-amber-400',
                  sm ? 'w-4 h-4' : 'w-5 h-5'
                )}
                style={{ animationDelay: `${(s - 1) * 400}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Ghost distribution bars */}
        <div className={sm ? 'space-y-1' : 'space-y-3'}>
          {[5, 4, 3, 2, 1].map((star, i) => (
            <div key={star} className={cn('flex items-center', sm ? 'gap-1.5' : 'gap-3')}>
              <div
                className={cn(
                  'flex items-center gap-0.5 justify-end flex-shrink-0',
                  sm ? 'w-7' : 'w-14'
                )}
              >
                <span className={cn('font-medium text-foreground/[0.40] tabular-nums', sm ? 'text-[10px]' : 'text-sm')}>
                  {star}
                </span>
                <Star className={cn('text-foreground/[0.35]', sm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5')} />
              </div>

              <div
                className={cn(
                  'flex-1 rounded-lg overflow-hidden',
                  sm ? 'h-3.5' : 'h-6'
                )}
              >
                <div
                  className="h-full rounded-lg animate-hud-bar-sweep"
                  style={{ width: `${ghostBarWidths[i]}%`, animationDelay: `${i * 300}ms` }}
                />
              </div>

              <span className={cn('text-foreground/[0.25] text-right tabular-nums', sm ? 'text-[10px] w-5' : 'text-sm w-20')} />
            </div>
          ))}
        </div>

        <p className={cn('text-center text-muted-foreground/80', sm ? 'text-xs' : 'text-sm', 'animate-hud-breathe')}>
          Waiting for ratings...
        </p>
      </div>
    )
  }

  let sum = 0
  for (let i = 1; i <= 5; i++) sum += i * (counts[String(i)] ?? 0)
  const avg = total > 0 ? (sum / total).toFixed(1) : '0'
  const maxCount = Math.max(...[1, 2, 3, 4, 5].map((s) => counts[String(s)] ?? 0), 1)

  return (
    <div className={cn('mx-auto', sm ? 'space-y-4 max-w-xs' : 'space-y-6 max-w-md')}>
      {/* Average */}
      <div className={cn('text-center', !sm && 'py-4')}>
        <div className={cn('inline-flex items-baseline', sm ? 'gap-1.5' : 'gap-2 mb-3')}>
          <span className={cn('font-bold text-foreground tabular-nums', sm ? 'text-4xl' : 'text-5xl')}>
            {avg}
          </span>
          <span className={cn('text-muted-foreground', sm ? 'text-lg' : 'text-xl')}>/ 5</span>
        </div>
        <div className={cn('flex items-center justify-center', sm ? 'gap-0.5 mt-1' : 'gap-1')}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'transition-colors',
                sm ? 'w-4 h-4' : 'w-5 h-5',
                star <= Math.round(Number(avg))
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* Distribution bars */}
      <div className={sm ? 'space-y-1' : 'space-y-3'}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[String(star)] ?? 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const barWidth = (count / maxCount) * 100

          return (
            <div key={star} className={cn('flex items-center', sm ? 'gap-1.5' : 'gap-3')}>
              <div
                className={cn(
                  'flex items-center gap-0.5 justify-end flex-shrink-0',
                  sm ? 'w-7' : 'w-14'
                )}
              >
                <span
                  className={cn(
                    'font-medium text-muted-foreground tabular-nums',
                    sm ? 'text-[10px]' : 'text-sm'
                  )}
                >
                  {star}
                </span>
                <Star
                  className={cn(
                    'fill-amber-400 text-amber-400',
                    sm ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
                  )}
                />
              </div>

              <div
                className={cn(
                  'flex-1 bg-muted/40 rounded-lg overflow-hidden',
                  sm ? 'h-3.5' : 'h-6'
                )}
              >
                <div
                  className="h-full rounded-lg transition-all duration-300 ease-out"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: getChartColor(5 - star),
                  }}
                />
              </div>

              <span
                className={cn(
                  'text-muted-foreground text-right tabular-nums',
                  sm ? 'text-[10px] w-5' : 'text-sm w-20'
                )}
              >
                {count}
                {!sm && <span className="text-xs"> ({pct}%)</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
