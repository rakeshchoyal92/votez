import { Copy, QrCode, Settings2, Users, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ShareBarProps {
  code: string
  showQR: boolean
  showSettings: boolean
  hasData: boolean
  stats: { participantCount: number; responseCount: number } | null
  onCopyCode: () => void
  onToggleQR: () => void
  onToggleSettings: () => void
}

export function ShareBar({
  code,
  showQR,
  showSettings,
  hasData,
  stats,
  onCopyCode,
  onToggleQR,
  onToggleSettings,
}: ShareBarProps) {
  return (
    <Card className="mb-6 border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center justify-between p-3 sm:p-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline">
              Join Code
            </span>
            <code className="text-lg sm:text-xl font-mono font-bold text-foreground tracking-[0.2em]">
              {code}
            </code>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopyCode}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy code</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showQR ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={onToggleQR}
              >
                <QrCode className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle QR Code</TooltipContent>
          </Tooltip>
        </div>

        {/* Inline stats */}
        {hasData && stats && (
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium tabular-nums">{stats.participantCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="font-medium tabular-nums">{stats.responseCount}</span>
            </div>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showSettings ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={onToggleSettings}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  )
}
