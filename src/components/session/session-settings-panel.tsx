import { useState } from 'react'
import { RotateCcw, Loader2, Check, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { SettingsCard, SectionLabel } from './content-panel'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const DEFAULT_BG_COLOR = '#1e293b'
const DEFAULT_ACCENT_COLOR = '#6366f1'
const DEFAULT_TEXT_COLOR = '#ffffff'

interface ThemePreset {
  name: string
  bg: string
  accent: string
  text: string
}

const THEME_PRESETS: ThemePreset[] = [
  { name: 'Midnight', bg: '#1e293b', accent: '#6366f1', text: '#ffffff' },
  { name: 'Ocean', bg: '#0c1929', accent: '#06b6d4', text: '#e0f2fe' },
  { name: 'Sunset', bg: '#1c1412', accent: '#f97316', text: '#fef3c7' },
  { name: 'Forest', bg: '#0a1f14', accent: '#10b981', text: '#d1fae5' },
  { name: 'Berry', bg: '#1a0a24', accent: '#d946ef', text: '#fae8ff' },
  { name: 'Ember', bg: '#1a1110', accent: '#ef4444', text: '#fecaca' },
  { name: 'Gold', bg: '#1a1508', accent: '#eab308', text: '#fef9c3' },
  { name: 'Arctic', bg: '#0f172a', accent: '#38bdf8', text: '#f0f9ff' },
  { name: 'Neon', bg: '#0a0a0a', accent: '#22c55e', text: '#bbf7d0' },
  { name: 'Rose', bg: '#1c0f14', accent: '#f43f5e', text: '#ffe4e6' },
]

interface SessionSettingsPanelProps {
  // Branding values
  brandBgColor?: string
  brandAccentColor?: string
  brandTextColor?: string
  brandLogoUrl?: string | null
  brandBackgroundImageUrl?: string | null

  // Limits
  maxParticipants?: number

  // Quiz mode
  isQuizMode: boolean
  onToggleQuizMode: (val: boolean) => void

  // Stats (for reset confirmation)
  participantCount: number
  responseCount: number

  // Handlers
  onUpdateBranding: (updates: {
    brandBgColor?: string
    brandAccentColor?: string
    brandTextColor?: string
  }) => void
  onUploadImage: (field: 'brandLogoId' | 'brandBackgroundImageId', storageId: string) => void
  onRemoveImage: (field: 'brandLogoId' | 'brandBackgroundImageId') => void
  onChangeMaxParticipants: (val: number | undefined) => void
  onResetSession: () => Promise<void>
}

export function SessionSettingsPanel({
  brandBgColor,
  brandAccentColor,
  brandTextColor,
  brandLogoUrl,
  brandBackgroundImageUrl,
  maxParticipants,
  isQuizMode,
  onToggleQuizMode,
  participantCount,
  responseCount,
  onUpdateBranding,
  onUploadImage,
  onRemoveImage,
  onChangeMaxParticipants,
  onResetSession,
}: SessionSettingsPanelProps) {
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    try {
      await onResetSession()
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header strip */}
      <div className="flex items-center px-4 py-2.5 border-b border-border/30 flex-shrink-0">
        <span className="text-xs font-medium text-foreground/70">Session settings</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Colors */}
          <SettingsCard>
            <SectionLabel>Theme</SectionLabel>
            <div className="grid grid-cols-5 gap-2">
              {THEME_PRESETS.map((preset) => {
                const isActive =
                  (brandBgColor ?? DEFAULT_BG_COLOR) === preset.bg &&
                  (brandAccentColor ?? DEFAULT_ACCENT_COLOR) === preset.accent &&
                  (brandTextColor ?? DEFAULT_TEXT_COLOR) === preset.text
                return (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    onClick={() =>
                      onUpdateBranding({
                        brandBgColor: preset.bg,
                        brandAccentColor: preset.accent,
                        brandTextColor: preset.text,
                      })
                    }
                    className={cn(
                      'group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all',
                      isActive
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div
                      className="relative w-8 h-8 rounded-md border border-white/10 shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: preset.bg }}
                    >
                      {/* Accent dot */}
                      <div
                        className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: preset.accent }}
                      />
                      {/* Check mark for active */}
                      {isActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check
                            className="w-3.5 h-3.5"
                            style={{ color: preset.text }}
                            strokeWidth={3}
                          />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground leading-none truncate w-full text-center">
                      {preset.name}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="border-t border-border/30 pt-3 mt-1 space-y-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Custom</span>
              <ColorPicker
                label="Background"
                value={brandBgColor ?? ''}
                defaultValue={DEFAULT_BG_COLOR}
                onChange={(color) => onUpdateBranding({ brandBgColor: color })}
              />
              <ColorPicker
                label="Accent"
                value={brandAccentColor ?? ''}
                defaultValue={DEFAULT_ACCENT_COLOR}
                onChange={(color) => onUpdateBranding({ brandAccentColor: color })}
              />
              <ColorPicker
                label="Text"
                value={brandTextColor ?? ''}
                defaultValue={DEFAULT_TEXT_COLOR}
                onChange={(color) => onUpdateBranding({ brandTextColor: color })}
              />
            </div>
          </SettingsCard>

          {/* Images */}
          <SettingsCard>
            <SectionLabel>Images</SectionLabel>
            <ImageUpload
              label="Logo"
              currentUrl={brandLogoUrl}
              onUpload={(id) => onUploadImage('brandLogoId', id)}
              onRemove={() => onRemoveImage('brandLogoId')}
            />
            <ImageUpload
              label="Background image"
              currentUrl={brandBackgroundImageUrl}
              onUpload={(id) => onUploadImage('brandBackgroundImageId', id)}
              onRemove={() => onRemoveImage('brandBackgroundImageId')}
            />
          </SettingsCard>

          {/* Quiz mode */}
          <SettingsCard>
            <SectionLabel>Quiz mode</SectionLabel>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-500/60" />
                <Label htmlFor="quiz-mode" className="text-[13px] text-foreground cursor-pointer">
                  Enable quiz scoring
                </Label>
              </div>
              <Switch
                id="quiz-mode"
                checked={isQuizMode}
                onCheckedChange={onToggleQuizMode}
              />
            </div>
            {isQuizMode && (
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                MC questions with a correct answer will score points. A leaderboard is shown between questions.
              </p>
            )}
          </SettingsCard>

          {/* Limits */}
          <SettingsCard>
            <SectionLabel>Limits</SectionLabel>
            <div className="flex items-center justify-between">
              <Label htmlFor="max-participants" className="text-[13px] text-foreground">
                Max participants
              </Label>
              <Input
                id="max-participants"
                type="number"
                min={0}
                value={maxParticipants ?? ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  onChangeMaxParticipants(isNaN(val) || val <= 0 ? undefined : val)
                }}
                placeholder="Unlimited"
                className="h-7 w-24 text-xs text-right"
              />
            </div>
          </SettingsCard>

          {/* Danger zone */}
          <SettingsCard className="border-destructive/20">
            <SectionLabel>Danger zone</SectionLabel>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={resetting || (participantCount === 0 && responseCount === 0)}
                  className="w-full h-8 text-xs gap-1.5 font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {resetting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset session data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete{' '}
                    <span className="font-semibold text-foreground">{responseCount}</span>{' '}
                    response{responseCount !== 1 ? 's' : ''} and{' '}
                    <span className="font-semibold text-foreground">{participantCount}</span>{' '}
                    participant{participantCount !== 1 ? 's' : ''}.
                    All questions will be kept intact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleReset}
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SettingsCard>
        </div>
      </div>
    </div>
  )
}
