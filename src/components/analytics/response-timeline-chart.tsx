import { useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts'
import { getChartColor } from '@/lib/utils'

interface ResponseTimelineChartProps {
  responses: { answeredAt: number }[]
}

export function ResponseTimelineChart({ responses }: ResponseTimelineChartProps) {
  const buckets = useMemo(() => {
    if (responses.length === 0) return []

    const timestamps = responses.map((r) => r.answeredAt)
    const min = Math.min(...timestamps)
    const max = Math.max(...timestamps)
    const range = max - min

    // Adaptive bucket count: 8-15 buckets depending on range
    const bucketCount = Math.max(6, Math.min(15, Math.ceil(responses.length / 3)))
    const bucketSize = range > 0 ? range / bucketCount : 1

    const result: { index: number; count: number; label: string }[] = []
    for (let i = 0; i < bucketCount; i++) {
      const bucketStart = min + i * bucketSize
      const elapsed = Math.round((bucketStart - min) / 1000)
      const label = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m${elapsed % 60 > 0 ? ` ${elapsed % 60}s` : ''}`
      result.push({ index: i, count: 0, label })
    }

    for (const ts of timestamps) {
      const bucketIdx = range > 0 ? Math.min(Math.floor((ts - min) / bucketSize), bucketCount - 1) : 0
      result[bucketIdx].count++
    }

    return result
  }, [responses])

  if (buckets.length === 0) return null

  return (
    <div className="h-[50px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis dataKey="label" hide />
          <RechartsTooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '4px 8px',
            }}
            formatter={(value: number) => [`${value} response${value !== 1 ? 's' : ''}`, '']}
            labelFormatter={(label: string) => `At ${label}`}
          />
          <Bar
            dataKey="count"
            fill={getChartColor(0)}
            radius={[2, 2, 0, 0]}
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
