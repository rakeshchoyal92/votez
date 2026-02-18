import { PollChart } from './poll-chart'
import type { ChartLayout } from './chart-type-selector'

interface ResultsChartProps {
  options: string[]
  counts: Record<string, number>
  total: number
  size?: 'sm' | 'lg'
  layout?: ChartLayout
  correctAnswer?: string
}

export function ResultsChart({
  options,
  counts,
  total,
  size = 'sm',
  layout = 'bars',
  correctAnswer,
}: ResultsChartProps) {
  return (
    <PollChart
      options={options}
      counts={counts}
      total={total}
      size={size}
      layout={layout}
      correctAnswer={correctAnswer}
    />
  )
}
