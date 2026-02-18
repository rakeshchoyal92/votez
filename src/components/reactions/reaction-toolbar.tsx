import { cn } from '@/lib/utils'
import type { ReactionType } from '@/hooks/useReactions'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ReactionToolbarProps {
  onTrigger: (type: ReactionType) => void
  activeReaction: ReactionType | null
  compact?: boolean
}

const REACTIONS: { type: ReactionType; emoji: string; label: string; key: string }[] = [
  { type: 'drumroll', emoji: '🥁', label: 'Drumroll', key: '1' },
  { type: 'applause', emoji: '👏', label: 'Applause', key: '2' },
  { type: 'confetti', emoji: '🎉', label: 'Confetti', key: '3' },
  { type: 'hearts', emoji: '❤️', label: 'Hearts', key: '4' },
]

export function ReactionToolbar({ onTrigger, activeReaction, compact }: ReactionToolbarProps) {
  return (
    <div className="flex items-center gap-1">
      {REACTIONS.map((r) => (
        <Tooltip key={r.type}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onTrigger(r.type)}
              className={cn(
                'rounded-md transition-all',
                compact
                  ? 'w-5 h-5 text-[10px] hover:bg-white/10'
                  : 'w-9 h-9 text-lg hover:bg-white/10',
                activeReaction === r.type && 'bg-white/15 ring-1 ring-white/20'
              )}
            >
              {r.emoji}
            </button>
          </TooltipTrigger>
          <TooltipContent side={compact ? 'top' : 'top'} className="text-xs">
            {r.label} ({r.key})
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
