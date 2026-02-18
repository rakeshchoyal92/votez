import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { CheckCircle2 } from 'lucide-react'
import { getChartColor, safeKey } from '@/lib/utils'
import type { ChartLayout } from './chart-type-selector'

interface PollChartProps {
  options: string[]
  counts: Record<string, number>
  total: number
  layout?: ChartLayout
  size?: 'sm' | 'lg'
  showPercentage?: boolean
  correctAnswer?: string
  animated?: boolean
  showEmpty?: boolean
}

export function PollChart({
  options,
  counts,
  total,
  layout = 'bars',
  size = 'sm',
  showPercentage = true,
  correctAnswer,
  animated = true,
  showEmpty = false,
}: PollChartProps) {
  if (total === 0 && !showEmpty) {
    const barHeights = [40, 25, 60, 35]
    const height = size === 'lg' ? 350 : 220
    return (
      <div className="w-full relative" style={{ height }}>
        {/* Ghost bars */}
        <div className="absolute inset-0 flex items-end justify-center gap-6 px-12 pb-10">
          {barHeights.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5 flex-1 max-w-20 h-full justify-end">
              <div
                className="w-full rounded-t-md bg-foreground/[0.12] animate-hud-bar-sweep"
                style={{ height: `${h}%`, animationDelay: `${i * 400}ms` }}
              />
              {/* Ghost x-axis label */}
              <div
                className="h-2 rounded-full bg-foreground/[0.25] animate-hud-breathe"
                style={{ width: `${50 + i * 8}%`, animationDelay: `${i * 300}ms` }}
              />
            </div>
          ))}
        </div>

        {/* Baseline glow */}
        <div
          className="absolute left-8 right-8 bottom-10 h-px animate-hud-baseline-glow"
          style={{ background: 'hsl(var(--foreground) / 0.15)', boxShadow: '0 0 8px hsl(var(--foreground) / 0.1)' }}
        />

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className={`text-muted-foreground/80 ${size === 'lg' ? 'text-sm' : 'text-xs'} animate-hud-breathe`}>
            Waiting for votes...
          </p>
        </div>
      </div>
    )
  }

  const data = options.map((option, i) => {
    const key = safeKey(option)
    const value = counts[key] ?? 0
    return {
      name: option,
      value,
      fill: getChartColor(i),
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
      isCorrect: correctAnswer === option,
    }
  })

  if (layout === 'bars') {
    return <VerticalBarChart data={data} size={size} showPercentage={showPercentage} animated={animated} />
  }

  if (layout === 'donut') {
    return <DonutChart data={data} total={total} size={size} showPercentage={showPercentage} animated={animated} />
  }

  return <PieChartView data={data} total={total} size={size} showPercentage={showPercentage} animated={animated} />
}

interface ChartData {
  name: string
  value: number
  fill: string
  pct: number
  isCorrect: boolean
}

function VerticalBarChart({
  data,
  size,
  showPercentage,
  animated,
}: {
  data: ChartData[]
  size: 'sm' | 'lg'
  showPercentage: boolean
  animated: boolean
}) {
  const height = size === 'lg' ? 350 : 220
  const barSize = size === 'lg' ? 48 : 32

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLabel = (props: any) => {
    const { x = 0, y = 0, width = 0, value = 0, index = 0 } = props
    const item = data[index]
    if (!item) return null
    const label = showPercentage ? `${value} (${item.pct}%)` : String(value)
    return (
      <text
        x={x + width / 2}
        y={y - 8}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={size === 'lg' ? 14 : 12}
        fontWeight={600}
      >
        {label}
      </text>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: size === 'lg' ? 13 : 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(val: string) => val.length > 14 ? val.slice(0, 12) + '...' : val}
          />
          <YAxis hide />
          <Bar
            dataKey="value"
            barSize={barSize}
            radius={[6, 6, 0, 0]}
            isAnimationActive={animated}
            animationDuration={600}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isCorrect ? '#40c057' : entry.fill} />
            ))}
            <LabelList content={renderLabel} position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Correct answer indicator */}
      {data.some((d) => d.isCorrect) && (
        <div className="flex items-center gap-1.5 justify-center mt-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">
            {data.find((d) => d.isCorrect)?.name}
          </span>
        </div>
      )}
    </div>
  )
}

function DonutChart({
  data,
  total,
  size,
  showPercentage,
  animated,
}: {
  data: ChartData[]
  total: number
  size: 'sm' | 'lg'
  showPercentage: boolean
  animated: boolean
}) {
  const chartSize = size === 'lg' ? 350 : 220
  const outerRadius = size === 'lg' ? 120 : 80
  const innerRadius = size === 'lg' ? 65 : 45

  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={chartSize}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            isAnimationActive={animated}
            animationDuration={600}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isCorrect ? '#40c057' : entry.fill} />
            ))}
          </Pie>
          <Legend
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: string, entry: any) => {
              const item = entry.payload as ChartData | undefined
              if (!item) return value
              const suffix = showPercentage ? ` (${item.pct}%)` : ` — ${item.value}`
              return (
                <span className="text-sm text-foreground">
                  {value}{suffix}
                </span>
              )
            }}
          />
          {/* Center total */}
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize={size === 'lg' ? 28 : 20}
            fontWeight={700}
          >
            {total}
          </text>
          <text
            x="50%"
            y={size === 'lg' ? '56%' : '58%'}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize={size === 'lg' ? 13 : 10}
          >
            votes
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieChartView({
  data,
  total,
  size,
  showPercentage,
  animated,
}: {
  data: ChartData[]
  total: number
  size: 'sm' | 'lg'
  showPercentage: boolean
  animated: boolean
}) {
  const chartSize = size === 'lg' ? 350 : 220
  const outerRadius = size === 'lg' ? 130 : 85

  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius: ir,
    outerRadius: or,
    percent,
  }: {
    cx: number
    cy: number
    midAngle: number
    innerRadius: number
    outerRadius: number
    percent: number
  }) => {
    if (percent < 0.05) return null
    const RADIAN = Math.PI / 180
    const radius = ir + (or - ir) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size === 'lg' ? 14 : 11}
        fontWeight={700}
      >
        {showPercentage ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <ResponsiveContainer width="100%" height={chartSize}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={outerRadius}
            dataKey="value"
            isAnimationActive={animated}
            animationDuration={600}
            stroke="hsl(var(--background))"
            strokeWidth={2}
            label={renderPieLabel}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isCorrect ? '#40c057' : entry.fill} />
            ))}
          </Pie>
          <Legend
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: string, entry: any) => {
              const item = entry.payload as ChartData | undefined
              if (!item) return value
              return (
                <span className="text-sm text-foreground">
                  {value} — {item.value}
                </span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
