import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import { getChartColor } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'

interface QuestionTimeline {
  questionId: Id<'questions'>
  questionTitle: string
  responses: { answeredAt: number }[]
}

interface SessionTimelineChartProps {
  timeline: QuestionTimeline[]
}

export function SessionTimelineChart({ timeline }: SessionTimelineChartProps) {
  const { buckets, questionKeys } = useMemo(() => {
    // Gather all response timestamps
    const allTimestamps: number[] = []
    for (const qt of timeline) {
      for (const r of qt.responses) {
        allTimestamps.push(r.answeredAt)
      }
    }

    if (allTimestamps.length < 2) {
      return { buckets: [], questionKeys: [] }
    }

    const min = Math.min(...allTimestamps)
    const max = Math.max(...allTimestamps)
    const range = max - min

    // 20-30 buckets across the full session
    const bucketCount = Math.max(12, Math.min(30, Math.ceil(allTimestamps.length / 4)))
    const bucketSize = range / bucketCount

    // Build question keys (truncated titles)
    const qKeys = timeline
      .filter((qt) => qt.responses.length > 0)
      .map((qt) => ({
        id: qt.questionId,
        key: `q_${qt.questionId}`,
        label: qt.questionTitle.length > 30
          ? qt.questionTitle.slice(0, 28) + '...'
          : qt.questionTitle || 'Untitled',
      }))

    // Initialize buckets
    const result: Record<string, string | number>[] = []
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = min + i * bucketSize
      const elapsed = Math.round((bucketStart - min) / 1000)
      const label =
        elapsed < 60
          ? `${elapsed}s`
          : `${Math.floor(elapsed / 60)}m${elapsed % 60 > 0 ? ` ${elapsed % 60}s` : ''}`

      const bucket: Record<string, string | number> = { label, _elapsed: elapsed }
      for (const qk of qKeys) {
        bucket[qk.key] = 0
      }
      result.push(bucket)
    }

    // Fill buckets
    for (const qt of timeline) {
      const qk = qKeys.find((k) => k.id === qt.questionId)
      if (!qk) continue
      for (const r of qt.responses) {
        const idx = Math.min(
          Math.floor((r.answeredAt - min) / bucketSize),
          bucketCount - 1
        )
        ;(result[idx][qk.key] as number)++
      }
    }

    return { buckets: result, questionKeys: qKeys }
  }, [timeline])

  if (buckets.length === 0) {
    return null
  }

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Response Flow</h3>
            <p className="text-[11px] text-muted-foreground">
              How responses came in over the session
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                {questionKeys.map((qk, i) => (
                  <linearGradient key={qk.key} id={`gradient-${qk.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={getChartColor(i)} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={getChartColor(i)} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.4 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.2, strokeWidth: 1 }}
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                labelFormatter={(label: string) => `At ${label}`}
                formatter={(value: number, name: string) => {
                  const qk = questionKeys.find((k) => k.key === name)
                  return [`${value}`, qk?.label ?? name]
                }}
              />
              {questionKeys.map((qk, i) => (
                <Area
                  key={qk.key}
                  type="monotone"
                  dataKey={qk.key}
                  stackId="responses"
                  stroke={getChartColor(i)}
                  strokeWidth={1.5}
                  fill={`url(#gradient-${qk.key})`}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        {questionKeys.length > 1 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-border/30">
            {questionKeys.map((qk, i) => (
              <div key={qk.key} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getChartColor(i) }}
                />
                <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                  {qk.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
