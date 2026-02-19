import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from 'recharts'
import { Timer, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResponseTimelineChartProps {
  responses: { answeredAt: number }[]
  accentColor?: string
}

export function ResponseTimelineChart({
  responses,
  accentColor = 'hsl(var(--primary))',
}: ResponseTimelineChartProps) {
  const { buckets, stats } = useMemo(() => {
    if (responses.length === 0) return { buckets: [], stats: null }

    const timestamps = responses.map((r) => r.answeredAt).sort((a, b) => a - b)
    const min = timestamps[0]
    const max = timestamps[timestamps.length - 1]
    const range = max - min

    // Adaptive bucket count
    const bucketCount = Math.max(8, Math.min(20, Math.ceil(responses.length / 2)))
    const bucketSize = range > 0 ? range / bucketCount : 1

    const result: { index: number; count: number; label: string }[] = []
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = min + i * bucketSize
      const elapsed = Math.round((bucketStart - min) / 1000)
      const label =
        elapsed < 60
          ? `${elapsed}s`
          : `${Math.floor(elapsed / 60)}m${elapsed % 60 > 0 ? ` ${elapsed % 60}s` : ''}`
      result.push({ index: i, count: 0, label })
    }

    for (const ts of timestamps) {
      const bucketIdx = range > 0
        ? Math.min(Math.floor((ts - min) / bucketSize), bucketCount - 1)
        : 0
      result[bucketIdx].count++
    }

    // Compute stats
    const totalDuration = range / 1000
    const medianIdx = Math.floor(timestamps.length / 2)
    const medianTime = (timestamps[medianIdx] - min) / 1000
    // Peak bucket
    let peakCount = 0
    for (const b of result) {
      if (b.count > peakCount) peakCount = b.count
    }

    return {
      buckets: result,
      stats: {
        totalDuration,
        medianTime,
        peakRate: peakCount,
        totalResponses: responses.length,
      },
    }
  }, [responses])

  if (buckets.length === 0) return null

  const gradientId = `spark-gradient-${Math.random().toString(36).slice(2, 8)}`

  return (
    <div className="space-y-2.5">
      {/* Stats row */}
      {stats && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Timer className="w-3 h-3 opacity-50" />
            <span>
              Median{' '}
              <span className="font-semibold text-foreground/70 tabular-nums">
                {stats.medianTime < 60
                  ? `${Math.round(stats.medianTime)}s`
                  : `${Math.floor(stats.medianTime / 60)}m ${Math.round(stats.medianTime % 60)}s`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Zap className="w-3 h-3 opacity-50" />
            <span>
              Peak{' '}
              <span className="font-semibold text-foreground/70 tabular-nums">
                {stats.peakRate}/batch
              </span>
            </span>
          </div>
          <div className={cn(
            'ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full',
            stats.totalDuration < 30
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : stats.totalDuration < 120
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
          )}>
            {stats.totalDuration < 60
              ? `${Math.round(stats.totalDuration)}s span`
              : `${Math.floor(stats.totalDuration / 60)}m ${Math.round(stats.totalDuration % 60)}s span`}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[60px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={buckets} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <RechartsTooltip
              cursor={{ stroke: accentColor, strokeOpacity: 0.3, strokeWidth: 1 }}
              contentStyle={{
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                padding: '4px 10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number) => [
                `${value} response${value !== 1 ? 's' : ''}`,
                '',
              ]}
              labelFormatter={(label: string) => `At ${label}`}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={accentColor}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
