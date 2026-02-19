import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { CheckCircle2 } from 'lucide-react'
import { cn, getChartColor, safeKey } from '@/lib/utils'
import type { ChartLayout } from './chart-type-selector'
import { WaitingForResponses } from './waiting-for-responses'

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
  chartColors?: string[]
  optionImageUrls?: (string | null)[] | null
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
  chartColors,
  optionImageUrls,
}: PollChartProps) {
  if (total === 0 && !showEmpty) {
    return <WaitingForResponses size={size} />
  }

  const hasImages = optionImageUrls?.some(url => url != null) ?? false

  const data = options.map((option, i) => {
    const key = safeKey(option)
    const value = counts[key] ?? 0
    return {
      name: option,
      value,
      fill: chartColors?.[i % (chartColors.length || 1)] ?? getChartColor(i),
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
      isCorrect: correctAnswer === option,
      imageUrl: optionImageUrls?.[i] ?? null,
    }
  })

  if (layout === 'bars') {
    return <VerticalBarChart data={data} size={size} showPercentage={showPercentage} animated={animated} hasImages={hasImages} />
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
  imageUrl: string | null
}

/* ═══════════════════════════════════════════════════════════ */
/*  Ranked legend item — used by donut & pie chart layouts    */
/* ═══════════════════════════════════════════════════════════ */

function RankedLegendItem({
  item,
  rank,
  maxValue,
  showPercentage,
  size,
}: {
  item: ChartData
  rank: number
  maxValue: number
  showPercentage: boolean
  size: 'sm' | 'lg'
}) {
  const sm = size === 'sm'
  const isWinner = rank === 0 && item.value > 0
  const isEmpty = item.value === 0
  const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0
  const color = item.isCorrect ? '#40c057' : item.fill

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-500',
        sm ? 'px-2 py-1' : 'px-4 py-3',
        isEmpty && 'opacity-30',
        isWinner && 'bg-white/[0.05] ring-1 ring-white/[0.08]'
      )}
    >
      <div className={cn('flex items-center', sm ? 'gap-1.5 mb-0.5' : 'gap-3 mb-2')}>
        {/* Color indicator */}
        <div
          className={cn('rounded-full flex-shrink-0', sm ? 'w-1.5 h-1.5' : 'w-3 h-3')}
          style={{
            backgroundColor: color,
            boxShadow: isWinner ? `0 0 8px 2px ${color}50` : 'none',
          }}
        />
        {/* Option image thumbnail */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            className={cn(
              'rounded object-cover flex-shrink-0',
              sm ? 'w-4 h-4' : 'w-8 h-8'
            )}
          />
        )}
        {/* Option name */}
        <span
          className={cn(
            'truncate font-medium',
            sm ? 'text-[9px] leading-tight' : 'text-sm',
            isEmpty ? 'text-muted-foreground/50' : 'text-foreground/90'
          )}
        >
          {item.name}
        </span>
        <span className="flex-1" />
        {/* Secondary count (lg only, when showing percentages) */}
        {!sm && showPercentage && (
          <span
            className={cn(
              'flex-shrink-0 tabular-nums text-sm',
              isEmpty ? 'text-muted-foreground/20' : 'text-muted-foreground/50'
            )}
          >
            {item.value}
          </span>
        )}
        {/* Primary stat */}
        <span
          className={cn(
            'flex-shrink-0 tabular-nums font-semibold',
            sm ? 'text-[9px]' : 'text-base',
            isEmpty
              ? 'text-muted-foreground/20'
              : isWinner
                ? 'text-foreground'
                : 'text-foreground/80'
          )}
        >
          {showPercentage ? `${item.pct}%` : item.value}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className={cn(
          'rounded-full overflow-hidden',
          sm ? 'h-[2px]' : 'h-[6px]',
          'bg-white/[0.04]'
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
            opacity: isEmpty ? 0 : 0.85,
            boxShadow: isWinner ? `0 0 12px ${color}40` : 'none',
          }}
        />
      </div>
    </div>
  )
}

function VerticalBarChart({
  data,
  size,
  showPercentage,
  animated,
  hasImages,
}: {
  data: ChartData[]
  size: 'sm' | 'lg'
  showPercentage: boolean
  animated: boolean
  hasImages?: boolean
}) {
  const sm = size === 'sm'
  const height = sm ? 220 : 350
  const barSize = sm ? 32 : 48

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
        fontSize={sm ? 12 : 14}
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
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: sm ? 11 : 13 }}
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

      {/* Option image thumbnails below chart */}
      {hasImages && (
        <div className="flex justify-center mt-1" style={{ paddingLeft: 10, paddingRight: 10 }}>
          <div className="flex w-full" style={{ justifyContent: 'space-around' }}>
            {data.map((entry, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: `${100 / data.length}%` }}>
                {entry.imageUrl ? (
                  <img
                    src={entry.imageUrl}
                    alt={entry.name}
                    className={cn(
                      'rounded-md object-cover border border-white/10',
                      sm ? 'w-8 h-8' : 'w-14 h-14'
                    )}
                  />
                ) : (
                  <div className={cn('rounded-md bg-muted/20', sm ? 'w-8 h-8' : 'w-14 h-14')} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
  const sm = size === 'sm'
  const chartDim = sm ? 140 : 340
  const outerRadius = sm ? 56 : 140
  const innerRadius = sm ? 32 : 80

  // Sort by value descending for ranked leaderboard
  const rankedData = [...data].sort((a, b) => b.value - a.value)
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={cn(
      'w-full flex',
      sm ? 'flex-col items-center gap-3' : 'items-center gap-0'
    )}>
      {/* Donut */}
      <div className={cn(
        sm ? 'flex-shrink-0' : 'w-1/2 flex justify-center flex-shrink-0'
      )}>
        <div style={{ width: chartDim, height: chartDim }}>
          <ResponsiveContainer width="100%" height="100%">
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
              {/* Center total */}
              <text
                x="50%"
                y="46%"
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize={sm ? 18 : 36}
                fontWeight={700}
              >
                {total}
              </text>
              <text
                x="50%"
                y={sm ? '58%' : '56%'}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={sm ? 8 : 12}
              >
                votes
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranked legend */}
      <div className={cn(
        'min-w-0',
        sm ? 'w-full space-y-0.5' : 'w-1/2 space-y-1.5'
      )}>
        {rankedData.map((item, rank) => (
          <RankedLegendItem
            key={item.name}
            item={item}
            rank={rank}
            maxValue={maxValue}
            showPercentage={showPercentage}
            size={size}
          />
        ))}
      </div>
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
  const sm = size === 'sm'
  const chartDim = sm ? 140 : 340
  const outerRadius = sm ? 60 : 140

  // Sort by value descending for ranked leaderboard
  const rankedData = [...data].sort((a, b) => b.value - a.value)
  const maxValue = Math.max(...data.map(d => d.value), 1)

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
        fontSize={sm ? 11 : 14}
        fontWeight={700}
      >
        {showPercentage ? `${(percent * 100).toFixed(0)}%` : ''}
      </text>
    )
  }

  return (
    <div className={cn(
      'w-full flex',
      sm ? 'flex-col items-center gap-3' : 'items-center gap-0'
    )}>
      {/* Pie chart */}
      <div className={cn(
        sm ? 'flex-shrink-0' : 'w-1/2 flex justify-center flex-shrink-0'
      )}>
        <div style={{ width: chartDim, height: chartDim }}>
          <ResponsiveContainer width="100%" height="100%">
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
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranked legend */}
      <div className={cn(
        'min-w-0',
        sm ? 'w-full space-y-0.5' : 'w-1/2 space-y-1.5'
      )}>
        {rankedData.map((item, rank) => (
          <RankedLegendItem
            key={item.name}
            item={item}
            rank={rank}
            maxValue={maxValue}
            showPercentage={showPercentage}
            size={size}
          />
        ))}
      </div>
    </div>
  )
}
