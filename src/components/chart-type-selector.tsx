import { BarChart3, PieChart, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ChartLayout = 'bars' | 'donut' | 'pie'

interface ChartTypeSelectorProps {
  value: ChartLayout
  onChange: (layout: ChartLayout) => void
  size?: 'sm' | 'md'
}

const CHART_OPTIONS: { value: ChartLayout; icon: typeof BarChart3; label: string }[] = [
  { value: 'bars', icon: BarChart3, label: 'Bars' },
  { value: 'donut', icon: PieChart, label: 'Donut' },
  { value: 'pie', icon: CircleDot, label: 'Pie' },
]

export function ChartTypeSelector({ value, onChange, size = 'md' }: ChartTypeSelectorProps) {
  return (
    <div className="inline-flex items-center rounded-lg bg-muted p-1 gap-0.5">
      {CHART_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isActive = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-all',
              size === 'sm' ? 'h-7 w-7' : 'h-8 px-2.5 gap-1.5',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={opt.label}
          >
            <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            {size === 'md' && (
              <span className="text-xs font-medium">{opt.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
