import { getChartColor } from '@/lib/utils'

interface ResultsChartProps {
  options: string[]
  counts: Record<string, number>
  total: number
  size?: 'sm' | 'lg'
}

export function ResultsChart({ options, counts, total, size = 'sm' }: ResultsChartProps) {
  const isLarge = size === 'lg'

  if (total === 0) {
    return (
      <div className="text-center py-12">
        <p className={`text-muted-foreground ${isLarge ? 'text-lg' : 'text-sm'}`}>
          No votes yet
        </p>
      </div>
    )
  }

  const maxCount = Math.max(...options.map((opt) => counts[opt] ?? 0), 1)

  return (
    <div className="space-y-4 w-full">
      {options.map((option, i) => {
        const count = counts[option] ?? 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const barWidth = total > 0 ? (count / maxCount) * 100 : 0

        return (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-foreground font-medium ${isLarge ? 'text-lg' : 'text-sm'}`}>
                {option}
              </span>
              <span className={`text-muted-foreground font-medium ${isLarge ? 'text-sm' : 'text-xs'}`}>
                {count} ({pct}%)
              </span>
            </div>
            <div className={`${isLarge ? 'h-10' : 'h-8'} bg-muted/50 rounded-lg overflow-hidden`}>
              <div
                className="h-full rounded-lg result-bar"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: getChartColor(i),
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
