import { useState } from 'react'
import { Link2, Hash, QrCode, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'

interface ShareDropdownProps {
  joinUrl: string
  code: string
  onCopyUrl: () => void
  onCopyCode: () => void
}

export function ShareDropdown({ joinUrl, code, onCopyUrl, onCopyCode }: ShareDropdownProps) {
  const [qrOpen, setQrOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={onCopyUrl} className="cursor-pointer gap-2">
            <Link2 className="w-4 h-4" />
            Copy join link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCopyCode} className="cursor-pointer gap-2">
            <Hash className="w-4 h-4" />
            <span>Copy code ({code})</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setQrOpen(true)} className="cursor-pointer gap-2">
            <QrCode className="w-4 h-4" />
            Show QR code
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Scan to join</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={joinUrl} size={200} level="M" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{joinUrl}</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Code: {code}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
