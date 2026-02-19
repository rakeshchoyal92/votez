import { Trophy, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LeaderboardEntry {
  participantId: string
  name: string
  score: number
  rank: number
}

interface LeaderboardDisplayProps {
  entries: LeaderboardEntry[]
  size?: 'sm' | 'lg'
}

export function LeaderboardDisplay({ entries, size = 'lg' }: LeaderboardDisplayProps) {
  const sm = size === 'sm'

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Trophy className={cn('text-muted-foreground/20', sm ? 'w-8 h-8' : 'w-12 h-12')} />
        <p className={cn('text-muted-foreground/40 mt-3', sm ? 'text-xs' : 'text-sm')}>
          No scores yet
        </p>
      </div>
    )
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3, sm ? 7 : 10)

  return (
    <div className={cn('w-full flex flex-col items-center animate-fade-in', sm ? 'gap-3' : 'gap-6')}>
      {/* Podium — top 3 */}
      <div className={cn(
        'flex items-end justify-center w-full',
        sm ? 'gap-2 mb-1' : 'gap-4 mb-2'
      )}>
        {/* 2nd place */}
        {top3.length >= 2 && (
          <PodiumCard entry={top3[1]} place={2} size={size} />
        )}
        {/* 1st place */}
        {top3.length >= 1 && (
          <PodiumCard entry={top3[0]} place={1} size={size} />
        )}
        {/* 3rd place */}
        {top3.length >= 3 && (
          <PodiumCard entry={top3[2]} place={3} size={size} />
        )}
      </div>

      {/* Remaining entries */}
      {rest.length > 0 && (
        <div className={cn('w-full', sm ? 'max-w-xs space-y-1' : 'max-w-md space-y-1.5')}>
          {rest.map((entry) => (
            <div
              key={entry.participantId}
              className={cn(
                'flex items-center rounded-lg bg-white/[0.04] border border-white/[0.06]',
                sm ? 'px-2.5 py-1.5 gap-2' : 'px-4 py-2.5 gap-3'
              )}
            >
              <span className={cn(
                'tabular-nums font-semibold text-muted-foreground/50 flex-shrink-0',
                sm ? 'text-[10px] w-4' : 'text-sm w-6'
              )}>
                {entry.rank}
              </span>
              <span className={cn(
                'font-medium text-foreground/90 truncate flex-1',
                sm ? 'text-[11px]' : 'text-sm'
              )}>
                {entry.name}
              </span>
              <span className={cn(
                'tabular-nums font-bold text-foreground flex-shrink-0',
                sm ? 'text-[11px]' : 'text-sm'
              )}>
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PLACE_CONFIG = {
  1: {
    icon: Trophy,
    gradient: 'from-amber-500/20 to-yellow-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    ring: 'ring-amber-500/20',
    label: '1st',
  },
  2: {
    icon: Medal,
    gradient: 'from-slate-400/20 to-gray-400/10',
    border: 'border-slate-400/30',
    iconColor: 'text-slate-300',
    ring: 'ring-slate-400/20',
    label: '2nd',
  },
  3: {
    icon: Award,
    gradient: 'from-orange-600/20 to-amber-700/10',
    border: 'border-orange-600/30',
    iconColor: 'text-orange-400',
    ring: 'ring-orange-600/20',
    label: '3rd',
  },
} as const

function PodiumCard({
  entry,
  place,
  size,
}: {
  entry: LeaderboardEntry
  place: 1 | 2 | 3
  size: 'sm' | 'lg'
}) {
  const sm = size === 'sm'
  const config = PLACE_CONFIG[place]
  const Icon = config.icon
  const isFirst = place === 1

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border bg-gradient-to-b ring-1',
        config.gradient,
        config.border,
        config.ring,
        isFirst
          ? sm ? 'px-4 py-3 min-w-[90px]' : 'px-6 py-5 min-w-[140px]'
          : sm ? 'px-3 py-2 min-w-[75px]' : 'px-5 py-4 min-w-[120px]'
      )}
    >
      <Icon className={cn(
        config.iconColor,
        isFirst
          ? sm ? 'w-5 h-5 mb-1.5' : 'w-8 h-8 mb-2'
          : sm ? 'w-4 h-4 mb-1' : 'w-6 h-6 mb-1.5'
      )} />
      <span className={cn(
        'font-bold text-foreground truncate max-w-full text-center',
        isFirst
          ? sm ? 'text-xs' : 'text-base'
          : sm ? 'text-[10px]' : 'text-sm'
      )}>
        {entry.name}
      </span>
      <span className={cn(
        'tabular-nums font-bold mt-0.5',
        isFirst
          ? sm ? 'text-sm text-amber-400' : 'text-xl text-amber-400'
          : sm ? 'text-[11px] text-foreground/80' : 'text-base text-foreground/80'
      )}>
        {entry.score.toLocaleString()}
      </span>
    </div>
  )
}
