import { useState, useEffect } from 'react'
import { RotateCcw, Loader2, Check, Trophy, Palette, Pipette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColorPicker } from '@/components/ui/color-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { SettingsCard, SectionLabel } from './content-panel'
import { cn } from '@/lib/utils'
import { THEME_PRESETS, RICH_THEME_PRESETS } from '@/lib/theme-presets'
import type { ThemePreset } from '@/lib/theme-presets'
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

interface SessionSettingsPanelProps {
  // Branding values
  brandBgColor?: string
  brandAccentColor?: string
  brandTextColor?: string
  brandLogoUrl?: string | null
  brandBackgroundImageUrl?: string | null

  // Persisted theme preset
  themePreset?: string
  onUpdateThemePreset?: (preset: ThemePreset) => void

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
  themePreset,
  onUpdateThemePreset,
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
  const [themeTab, setThemeTab] = useState<'presets' | 'custom'>(
    themePreset ? 'presets' : 'custom'
  )

  // Auto-switch tab when preset state changes (e.g. preset picked → show presets tab)
  useEffect(() => {
    setThemeTab(themePreset ? 'presets' : 'custom')
  }, [themePreset])

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
          {/* Theme — Presets vs Custom toggle */}
          <SettingsCard>
            <SectionLabel>Theme</SectionLabel>

            {/* Mode toggle */}
            <div className="flex rounded-lg bg-muted/50 p-0.5 mb-3">
              <button
                type="button"
                onClick={() => setThemeTab('presets')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  themeTab === 'presets'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground/70'
                )}
              >
                <Palette className="w-3 h-3" />
                Presets
              </button>
              <button
                type="button"
                onClick={() => setThemeTab('custom')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  themeTab === 'custom'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground/70'
                )}
              >
                <Pipette className="w-3 h-3" />
                Custom
              </button>
            </div>

            {/* Presets tab */}
            {themeTab === 'presets' && (
              <div className="space-y-2 animate-in fade-in-0 duration-150">
                {/* Classic presets */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Classic</span>
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    {THEME_PRESETS.map((preset) => {
                      const isActive = !!themePreset && themePreset === preset.name
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          title={preset.name}
                          onClick={() => {
                            if (onUpdateThemePreset) {
                              onUpdateThemePreset(preset)
                            } else {
                              onUpdateBranding({
                                brandBgColor: preset.bg,
                                brandAccentColor: preset.accent,
                                brandTextColor: preset.text,
                              })
                            }
                          }}
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
                            <div
                              className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: preset.accent }}
                            />
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
                </div>

                {/* Rich presets */}
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Rich</span>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {RICH_THEME_PRESETS.map((preset) => {
                      const isActive = !!themePreset && themePreset === preset.name
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          title={preset.name}
                          onClick={() => {
                            if (onUpdateThemePreset) {
                              onUpdateThemePreset(preset)
                            } else {
                              onUpdateBranding({
                                brandBgColor: preset.bg,
                                brandAccentColor: preset.accent,
                                brandTextColor: preset.text,
                              })
                            }
                          }}
                          className={cn(
                            'group relative flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-all',
                            isActive
                              ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <div
                            className="relative w-full h-8 rounded-md border border-white/10 shadow-sm transition-transform group-hover:scale-[1.04] overflow-hidden"
                            style={{ background: preset.bgGradient ?? preset.bg }}
                          >
                            <div
                              className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-black/20"
                              style={{ backgroundColor: preset.accent }}
                            />
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Check className="w-3.5 h-3.5" style={{ color: preset.text }} strokeWidth={3} />
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
                </div>
              </div>
            )}

            {/* Custom tab */}
            {themeTab === 'custom' && (
              <div className="space-y-3 animate-in fade-in-0 duration-150">
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

                {/* Live preview swatch */}
                <div className="flex items-center gap-2 pt-1">
                  <div
                    className="w-full h-7 rounded-md border border-white/10 flex items-center justify-center"
                    style={{ backgroundColor: brandBgColor || DEFAULT_BG_COLOR }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: brandTextColor || DEFAULT_TEXT_COLOR }}
                    >
                      Preview
                    </span>
                    <span
                      className="ml-1.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: brandAccentColor || DEFAULT_ACCENT_COLOR }}
                    />
                  </div>
                </div>
              </div>
            )}
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
