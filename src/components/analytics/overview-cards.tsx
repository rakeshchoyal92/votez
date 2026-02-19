import { Users, MessageSquare, Percent, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OverviewCardsProps {
  totalParticipants: number
  totalResponses: number
  responseRate: number
  sessionDuration: number | null
  isLoading?: boolean
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms <= 0) return '--'
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

function formatRate(rate: number): string {
  if (rate === 0) return 'N/A'
  return `${Math.round(rate * 100)}%`
}

const cards = [
  {
    key: 'participants',
    label: 'Participants',
    icon: Users,
    getValue: (p: OverviewCardsProps) => p.totalParticipants.toString(),
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    key: 'responses',
    label: 'Responses',
    icon: MessageSquare,
    getValue: (p: OverviewCardsProps) => p.totalResponses.toString(),
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    key: 'rate',
    label: 'Response Rate',
    icon: Percent,
    getValue: (p: OverviewCardsProps) => formatRate(p.responseRate),
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    key: 'duration',
    label: 'Duration',
    icon: Clock,
    getValue: (p: OverviewCardsProps) => formatDuration(p.sessionDuration),
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
  },
] as const

export function OverviewCards(props: OverviewCardsProps) {
  if (props.isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, getValue, color, bg }) => (
        <Card key={key} className="p-5">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {getValue(props)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
