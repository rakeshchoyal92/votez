import { Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SettingsPanelProps {
  showQR: boolean
  joinUrl: string
  maxParticipants: number | undefined
  onCopyUrl: () => void
  onChangeMaxParticipants: (val: number | undefined) => void
}

export function SettingsPanel({
  showQR,
  joinUrl,
  maxParticipants,
  onCopyUrl,
  onChangeMaxParticipants,
}: SettingsPanelProps) {
  return (
    <Card className="mb-6 animate-in slide-in-from-top-2 duration-200 border-border/50">
      <div className="p-4 sm:p-6 space-y-4">
        {/* QR Code */}
        {showQR && (
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-border/40">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-foreground text-lg mb-1">
                Share with your audience
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scan the QR code or share the URL below
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <code className="px-3 py-2 bg-muted rounded-lg text-xs sm:text-sm text-muted-foreground font-mono break-all">
                  {joinUrl}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onCopyUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy URL</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm">
              <QRCodeSVG value={joinUrl} size={140} level="M" />
            </div>
          </div>
        )}

        {/* Max participants */}
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap">
            Max participants
          </Label>
          <Input
            type="number"
            min={0}
            placeholder="Unlimited"
            value={maxParticipants ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : undefined
              onChangeMaxParticipants(val)
            }}
            className="w-28 h-9 text-sm"
          />
          <span className="text-xs text-muted-foreground">
            {!maxParticipants || maxParticipants === 0
              ? '(no limit)'
              : `(${maxParticipants} max)`}
          </span>
        </div>
      </div>
    </Card>
  )
}
