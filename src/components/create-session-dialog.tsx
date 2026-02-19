import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { THEME_PRESETS, RICH_THEME_PRESETS } from '@/lib/theme-presets'
import type { ThemePreset } from '@/lib/theme-presets'
import { Plus, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const DEFAULT_PRESET = THEME_PRESETS[0] // Midnight

interface CreateSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSessionDialog({ open, onOpenChange }: CreateSessionDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createSession = useMutation(api.sessions.create)

  const [title, setTitle] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset>(DEFAULT_PRESET)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !user || isCreating) return

    setIsCreating(true)
    try {
      const result = await createSession({
        title: title.trim(),
        presenterId: user.id,
        presenterName: user.user_metadata?.full_name ?? user.email ?? 'Presenter',
        themePreset: selectedPreset.name,
        brandBgColor: selectedPreset.bg,
        brandAccentColor: selectedPreset.accent,
        brandTextColor: selectedPreset.text,
      })
      setTitle('')
      setSelectedPreset(DEFAULT_PRESET)
      onOpenChange(false)
      navigate(`/session/${result.sessionId}`)
    } catch (err) {
      toast.error('Failed to create session')
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTitle('')
      setSelectedPreset(DEFAULT_PRESET)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[540px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>
            Give your session a title and pick a theme.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate}>
          {/* Title */}
          <div className="px-6 pb-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Session title (e.g., Team Retrospective)"
              autoFocus
              className="h-10"
            />
          </div>

          {/* Theme grid */}
          <div className="px-6 pb-2 max-h-[340px] overflow-y-auto">
            {/* Classic */}
            <div className="mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Classic
              </span>
              <div className="grid grid-cols-5 gap-2 mt-1.5">
                {THEME_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.name}
                    preset={preset}
                    isSelected={selectedPreset.name === preset.name}
                    onClick={() => setSelectedPreset(preset)}
                  />
                ))}
              </div>
            </div>

            {/* Rich / Daycare */}
            <div className="mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Rich
              </span>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {RICH_THEME_PRESETS.map((preset) => (
                  <RichPresetCard
                    key={preset.name}
                    preset={preset}
                    isSelected={selectedPreset.name === preset.name}
                    onClick={() => setSelectedPreset(preset)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isCreating} className="gap-2">
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PresetCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: ThemePreset
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={preset.name}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all',
        isSelected
          ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
          : 'hover:bg-muted/50'
      )}
    >
      <div
        className="relative w-9 h-9 rounded-md border border-white/10 shadow-sm transition-transform group-hover:scale-110"
        style={{ backgroundColor: preset.bg }}
      >
        <div
          className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/20"
          style={{ backgroundColor: preset.accent }}
        />
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Check className="w-3.5 h-3.5" style={{ color: preset.text }} strokeWidth={3} />
          </div>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground leading-none truncate w-full text-center">
        {preset.name}
      </span>
    </button>
  )
}

function RichPresetCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: ThemePreset
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={preset.name}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-all',
        isSelected
          ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
          : 'hover:bg-muted/50'
      )}
    >
      <div
        className="relative w-full h-10 rounded-md border border-white/10 shadow-sm transition-transform group-hover:scale-[1.04] overflow-hidden"
        style={{ background: preset.bgGradient ?? preset.bg }}
      >
        {/* Sample text with font hint */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[9px] font-semibold opacity-80"
            style={{ color: preset.text }}
          >
            Abc
          </span>
        </div>
        {/* Accent dot */}
        <div
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-black/20"
          style={{ backgroundColor: preset.accent }}
        />
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Check className="w-4 h-4" style={{ color: preset.text }} strokeWidth={3} />
          </div>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground leading-none truncate w-full text-center">
        {preset.name}
      </span>
    </button>
  )
}
