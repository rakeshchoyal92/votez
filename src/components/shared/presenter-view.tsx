import { QRCodeSVG } from 'qrcode.react'
import {
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft,
  QrCode,
  MoreVertical,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  CircleDot,
  RotateCcw,
  StopCircle,
  Timer,
  Minus,
  Square,
  SkipForward,
  Circle,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PresenterQuestionContent } from './presenter-question-content'
import { LeaderboardDisplay } from '@/components/leaderboard-display'
import type { LeaderboardEntry } from '@/components/leaderboard-display'
import { AnimatedCount } from '@/components/animated-count'
import { ReactionOverlay, ReactionToolbar } from '@/components/reactions'
import type { ReactionType } from '@/hooks/useReactions'
import type { ChartLayout } from '@/components/chart-type-selector'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PresenterTimer, TimerOverlay } from '@/components/presenter-timer'
import type { TimerStyle } from '@/components/presenter-timer'
import { Palette } from 'lucide-react'

export interface ThemePreset {
  name: string
  bg: string
  accent: string
  text: string

  // Rich background
  bgGradient?: string
  bgPattern?: string
  bgPatternSize?: string
  bgPatternOpacity?: number

  // Overlay control
  overlayOpacity?: number
  overlayBlur?: number

  // Typography
  fontFamily?: string
  googleFont?: string
  googleFontWeight?: string

  // Shape
  borderRadius?: string

  // CSS variable overrides (HSL values)
  cssVars?: Record<string, string>

  // Chart colors
  chartColors?: string[]

  // Picker preview
  previewColors?: string[]
}

export const THEME_PRESETS: ThemePreset[] = [
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

export const RICH_THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Rainbow',
    bg: '#1a1040',
    accent: '#f59f00',
    text: '#ffffff',
    bgGradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 17%, #48dbfb 34%, #ff9ff3 51%, #54a0ff 68%, #5f27cd 85%, #ff6b6b 100%)',
    bgPattern: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.04) 20px, rgba(255,255,255,0.04) 22px)`,
    bgPatternOpacity: 0.6,
    overlayOpacity: 0.3,
    overlayBlur: 8,
    fontFamily: "'Fredoka', sans-serif",
    googleFont: 'Fredoka',
    googleFontWeight: '400;600;700',
    borderRadius: '1rem',
    cssVars: { '--primary': '45 100% 51%', '--muted-foreground': '0 0% 85%', '--border': '0 0% 100% / 0.12' },
    chartColors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1', '#fd7e14'],
    previewColors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
  },
  {
    name: 'Ocean World',
    bg: '#0a1628',
    accent: '#00d2ff',
    text: '#e0f7fa',
    bgGradient: 'linear-gradient(180deg, #0a1628 0%, #0d2137 30%, #0f3460 60%, #16536e 100%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q15 5 30 15 Q45 25 60 15 Q75 5 90 15 Q105 25 120 15' fill='none' stroke='rgba(0,210,255,0.12)' stroke-width='2'/%3E%3C/svg%3E")`,
    bgPatternSize: '120px 30px',
    bgPatternOpacity: 0.5,
    overlayOpacity: 0.25,
    overlayBlur: 6,
    fontFamily: "'Nunito', sans-serif",
    googleFont: 'Nunito',
    googleFontWeight: '400;600;700',
    borderRadius: '0.75rem',
    cssVars: { '--primary': '187 100% 50%', '--muted-foreground': '187 20% 75%', '--border': '187 100% 50% / 0.12' },
    chartColors: ['#00d2ff', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4', '#023e8a', '#0077b6', '#caf0f8'],
    previewColors: ['#0a1628', '#0f3460', '#00d2ff', '#48cae4'],
  },
  {
    name: 'Jungle Safari',
    bg: '#0a1f0e',
    accent: '#4ade80',
    text: '#ecfdf5',
    bgGradient: 'linear-gradient(160deg, #0a1f0e 0%, #14532d 40%, #1a3a2a 70%, #0f2b1a 100%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q35 15 30 25 Q25 15 30 5z' fill='rgba(74,222,128,0.08)'/%3E%3Cpath d='M10 35 Q15 45 10 55 Q5 45 10 35z' fill='rgba(74,222,128,0.06)'/%3E%3Cpath d='M50 30 Q55 40 50 50 Q45 40 50 30z' fill='rgba(74,222,128,0.07)'/%3E%3C/svg%3E")`,
    bgPatternSize: '60px 60px',
    bgPatternOpacity: 0.7,
    overlayOpacity: 0.28,
    overlayBlur: 6,
    fontFamily: "'Bubblegum Sans', cursive",
    googleFont: 'Bubblegum Sans',
    googleFontWeight: '400',
    borderRadius: '0.75rem',
    cssVars: { '--primary': '142 71% 65%', '--muted-foreground': '142 15% 75%', '--border': '142 71% 45% / 0.15' },
    chartColors: ['#4ade80', '#22c55e', '#86efac', '#bbf7d0', '#fbbf24', '#a3e635', '#34d399', '#6ee7b7'],
    previewColors: ['#0a1f0e', '#14532d', '#4ade80', '#a3e635'],
  },
  {
    name: 'Outer Space',
    bg: '#0f0a1e',
    accent: '#a78bfa',
    text: '#f5f3ff',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, #2e1065 0%, #1e1b4b 30%, #0f0a1e 70%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgba(255,255,255,0.4)'/%3E%3Ccircle cx='50' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Ccircle cx='30' cy='55' r='1.2' fill='rgba(255,255,255,0.35)'/%3E%3Ccircle cx='70' cy='65' r='0.8' fill='rgba(255,255,255,0.25)'/%3E%3Ccircle cx='65' cy='35' r='1.8' fill='rgba(167,139,250,0.3)'/%3E%3Ccircle cx='20' cy='75' r='1' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E")`,
    bgPatternSize: '80px 80px',
    bgPatternOpacity: 0.8,
    overlayOpacity: 0.22,
    overlayBlur: 4,
    fontFamily: "'Comic Neue', cursive",
    googleFont: 'Comic Neue',
    googleFontWeight: '400;700',
    borderRadius: '1rem',
    cssVars: { '--primary': '263 70% 76%', '--muted-foreground': '260 20% 75%', '--border': '263 70% 60% / 0.12' },
    chartColors: ['#a78bfa', '#818cf8', '#c4b5fd', '#e879f9', '#f0abfc', '#6366f1', '#8b5cf6', '#ddd6fe'],
    previewColors: ['#2e1065', '#1e1b4b', '#a78bfa', '#e879f9'],
  },
  {
    name: 'Candy Land',
    bg: '#1f0a2e',
    accent: '#f472b6',
    text: '#fdf2f8',
    bgGradient: 'linear-gradient(135deg, #6b21a8 0%, #a21caf 30%, #db2777 60%, #f472b6 100%)',
    bgPattern: `radial-gradient(circle 8px at 20px 20px, rgba(255,255,255,0.08) 50%, transparent 50%), radial-gradient(circle 6px at 50px 40px, rgba(255,255,255,0.06) 50%, transparent 50%), radial-gradient(circle 10px at 75px 15px, rgba(255,255,255,0.07) 50%, transparent 50%)`,
    bgPatternSize: '90px 55px',
    bgPatternOpacity: 0.7,
    overlayOpacity: 0.3,
    overlayBlur: 8,
    fontFamily: "'Fredoka', sans-serif",
    googleFont: 'Fredoka',
    googleFontWeight: '400;600;700',
    borderRadius: '1.25rem',
    cssVars: { '--primary': '330 81% 70%', '--muted-foreground': '330 20% 80%', '--border': '330 81% 70% / 0.15' },
    chartColors: ['#f472b6', '#e879f9', '#c084fc', '#fb7185', '#fda4af', '#a78bfa', '#f0abfc', '#fbcfe8'],
    previewColors: ['#6b21a8', '#db2777', '#f472b6', '#e879f9'],
  },
  {
    name: 'Sunshine',
    bg: '#1a1308',
    accent: '#fbbf24',
    text: '#fefce8',
    bgGradient: 'radial-gradient(ellipse at 50% 0%, #f59e0b 0%, #d97706 25%, #92400e 50%, #451a03 80%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='50' viewBox='0 0 100 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 Q25 30 50 40 Q75 50 100 40' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='3'/%3E%3Cpath d='M0 25 Q25 15 50 25 Q75 35 100 25' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='2'/%3E%3C/svg%3E")`,
    bgPatternSize: '100px 50px',
    bgPatternOpacity: 0.6,
    overlayOpacity: 0.28,
    overlayBlur: 6,
    fontFamily: "'Patrick Hand', cursive",
    googleFont: 'Patrick Hand',
    googleFontWeight: '400',
    borderRadius: '0.75rem',
    cssVars: { '--primary': '43 96% 56%', '--muted-foreground': '43 30% 80%', '--border': '43 96% 56% / 0.15' },
    chartColors: ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a', '#fb923c', '#fdba74', '#d97706', '#fef3c7'],
    previewColors: ['#451a03', '#d97706', '#fbbf24', '#fcd34d'],
  },
  {
    name: 'Fairy Tale',
    bg: '#0f0720',
    accent: '#c084fc',
    text: '#f5f3ff',
    bgGradient: 'linear-gradient(180deg, #1e1048 0%, #2d1b69 30%, #1a0f3c 60%, #0f0720 100%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='rgba(192,132,252,0.3)'/%3E%3Ccircle cx='55' cy='25' r='1.5' fill='rgba(251,191,36,0.35)'/%3E%3Ccircle cx='35' cy='60' r='2.5' fill='rgba(244,114,182,0.25)'/%3E%3Ccircle cx='80' cy='45' r='1.8' fill='rgba(192,132,252,0.28)'/%3E%3Ccircle cx='70' cy='80' r='2' fill='rgba(251,191,36,0.3)'/%3E%3Ccircle cx='20' cy='85' r='1.2' fill='rgba(244,114,182,0.2)'/%3E%3C/svg%3E")`,
    bgPatternSize: '100px 100px',
    bgPatternOpacity: 0.8,
    overlayOpacity: 0.22,
    overlayBlur: 4,
    fontFamily: "'Nunito', sans-serif",
    googleFont: 'Nunito',
    googleFontWeight: '400;600;700',
    borderRadius: '1rem',
    cssVars: { '--primary': '270 80% 76%', '--muted-foreground': '270 20% 78%', '--border': '270 80% 60% / 0.12' },
    chartColors: ['#c084fc', '#f472b6', '#fbbf24', '#a78bfa', '#e879f9', '#818cf8', '#f0abfc', '#ddd6fe'],
    previewColors: ['#1e1048', '#2d1b69', '#c084fc', '#f472b6'],
  },
]

interface RichThemeStyles {
  rootStyle: React.CSSProperties
  patternStyle: React.CSSProperties | null
  overlayStyle: React.CSSProperties
  cssVarStyle: React.CSSProperties
}

function buildRichThemeStyle(theme: ThemePreset | null | undefined): RichThemeStyles {
  const defaults: RichThemeStyles = {
    rootStyle: {},
    patternStyle: null,
    overlayStyle: {
      backgroundColor: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    cssVarStyle: {},
  }

  if (!theme) return defaults

  // Root style: gradient or flat bg, text color, font
  const rootStyle: React.CSSProperties = {}
  if (theme.bgGradient) {
    rootStyle.background = theme.bgGradient
  }
  if (theme.text) {
    rootStyle.color = theme.text
  }
  if (theme.fontFamily) {
    rootStyle.fontFamily = theme.fontFamily
  }

  // Pattern layer
  let patternStyle: React.CSSProperties | null = null
  if (theme.bgPattern) {
    patternStyle = {
      backgroundImage: theme.bgPattern,
      backgroundSize: theme.bgPatternSize ?? 'auto',
      backgroundRepeat: 'repeat',
      opacity: theme.bgPatternOpacity ?? 0.15,
    }
  }

  // Overlay
  const oOpacity = theme.overlayOpacity ?? 0.55
  const oBlur = theme.overlayBlur ?? 12
  const overlayStyle: React.CSSProperties = {
    backgroundColor: `rgba(0,0,0,${oOpacity})`,
    backdropFilter: `blur(${oBlur}px)`,
    WebkitBackdropFilter: `blur(${oBlur}px)`,
  }

  // CSS variable overrides
  const cssVarStyle: React.CSSProperties & Record<string, string> = {}
  if (theme.cssVars) {
    for (const [key, value] of Object.entries(theme.cssVars)) {
      cssVarStyle[key] = value
    }
  }
  if (theme.accent) {
    cssVarStyle['--session-accent'] = theme.accent
  }
  if (theme.borderRadius) {
    cssVarStyle['--radius'] = theme.borderRadius
  }

  return { rootStyle, patternStyle, overlayStyle, cssVarStyle }
}

interface PresenterViewQuestion {
  _id: string
  title: string
  type: string
  options?: string[]
  timeLimit?: number
  chartLayout?: string
  correctAnswer?: string
}

export interface SessionBranding {
  brandBgColor?: string
  brandAccentColor?: string
  brandTextColor?: string
  brandLogoUrl?: string | null
  brandBackgroundImageUrl?: string | null
}

export interface PresenterViewProps {
  size: 'full' | 'compact'

  // Data
  session: { title: string; code: string }
  questions: PresenterViewQuestion[]
  activeQuestion: PresenterViewQuestion | null
  activeIndex: number
  participantCount: number
  joinUrl: string
  results: { counts: Record<string, number>; totalResponses: number } | null

  // Visual state
  showQRSidebar: boolean
  showPercentages?: boolean
  chartLayout: ChartLayout
  remainingSeconds?: number | null
  timerStyle?: TimerStyle
  autoAdvance?: boolean
  onTimerStyleChange?: (style: TimerStyle) => void
  onToggleAutoAdvance?: () => void

  // Branding
  branding?: SessionBranding

  // Reactions
  activeReaction: ReactionType | null
  reactionTriggerKey: number
  onTriggerReaction: (type: ReactionType) => void

  // Navigation
  onPrev: () => void
  onNext: () => void
  onSetActiveQuestion: (index: number) => void
  onToggleQR: () => void

  // Full-mode-only controls (compact shows them disabled when missing)
  onEnd?: () => void
  onNavigateBack?: () => void
  onTogglePercentages?: () => void
  onChartOverride?: (layout: ChartLayout | null) => void
  onThemeOverride?: (preset: ThemePreset | null) => void
  activeThemePreset?: string | null
  activeRichTheme?: ThemePreset | null
  onResetResults?: () => void

  // Fullscreen
  isFullscreen?: boolean
  onToggleFullscreen?: () => void

  // Leaderboard (quiz mode)
  isQuizMode?: boolean
  showLeaderboard?: boolean
  onToggleLeaderboard?: () => void
  leaderboard?: LeaderboardEntry[]
}

function buildBrandingStyle(branding?: SessionBranding): React.CSSProperties {
  if (!branding) return {}
  const style: React.CSSProperties & Record<string, string> = {}

  if (branding.brandBgColor) {
    style.background = branding.brandBgColor
  }
  if (branding.brandBackgroundImageUrl) {
    style.backgroundImage = `url(${branding.brandBackgroundImageUrl})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  if (branding.brandTextColor) {
    style.color = branding.brandTextColor
  }
  if (branding.brandAccentColor) {
    style['--session-accent'] = branding.brandAccentColor
  }

  return style
}

export function PresenterView(props: PresenterViewProps) {
  if (props.size === 'full') return <FullPresenterView {...props} />
  return <CompactPresenterView {...props} />
}

/* ═══════════════════════════════════════════════════════ */
/*  Shared menu content — used by both full & compact     */
/* ═══════════════════════════════════════════════════════ */

function PresenterMenuItems({
  activeQuestion,
  showPercentages,
  showQRSidebar,
  chartLayout,
  timerStyle,
  autoAdvance,
  activeThemePreset,
  onTogglePercentages,
  onChartOverride,
  onToggleQR,
  onTimerStyleChange,
  onToggleAutoAdvance,
  onThemeOverride,
  onResetResults,
  onEnd,
}: Pick<
  PresenterViewProps,
  | 'activeQuestion'
  | 'showPercentages'
  | 'showQRSidebar'
  | 'chartLayout'
  | 'timerStyle'
  | 'autoAdvance'
  | 'activeThemePreset'
  | 'onTogglePercentages'
  | 'onChartOverride'
  | 'onToggleQR'
  | 'onTimerStyleChange'
  | 'onToggleAutoAdvance'
  | 'onThemeOverride'
  | 'onResetResults'
  | 'onEnd'
>) {
  return (
    <>
      <DropdownMenuItem
        onClick={() => onTogglePercentages?.()}
        disabled={!onTogglePercentages}
      >
        {showPercentages ? (
          <EyeOff className="w-4 h-4 mr-2" />
        ) : (
          <Eye className="w-4 h-4 mr-2" />
        )}
        {showPercentages ? 'Hide' : 'Show'} Percentages
      </DropdownMenuItem>

      {activeQuestion?.type === 'multiple_choice' && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={!onChartOverride}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Chart Layout
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onChartOverride?.('bars')} disabled={!onChartOverride}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Bars
              {chartLayout === 'bars' && <CheckIcon className="w-3 h-3 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChartOverride?.('donut')} disabled={!onChartOverride}>
              <PieChart className="w-4 h-4 mr-2" />
              Donut
              {chartLayout === 'donut' && <CheckIcon className="w-3 h-3 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChartOverride?.('pie')} disabled={!onChartOverride}>
              <CircleDot className="w-4 h-4 mr-2" />
              Pie
              {chartLayout === 'pie' && <CheckIcon className="w-3 h-3 ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}

      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={!onTimerStyleChange}>
          <Timer className="w-4 h-4 mr-2" />
          Timer Style
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem onClick={() => onTimerStyleChange?.('edge')} disabled={!onTimerStyleChange}>
            <Minus className="w-4 h-4 mr-2" />
            Edge Bar
            {timerStyle === 'edge' && <CheckIcon className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTimerStyleChange?.('corner')} disabled={!onTimerStyleChange}>
            <Square className="w-4 h-4 mr-2" />
            Corner Badge
            {timerStyle === 'corner' && <CheckIcon className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTimerStyleChange?.('hud')} disabled={!onTimerStyleChange}>
            <Circle className="w-4 h-4 mr-2" />
            HUD Ring
            {timerStyle === 'hud' && <CheckIcon className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuItem
        onClick={() => onToggleAutoAdvance?.()}
        disabled={!onToggleAutoAdvance}
      >
        <SkipForward className="w-4 h-4 mr-2" />
        Auto-Advance on Timer End
        {autoAdvance && <CheckIcon className="w-3 h-3 ml-auto text-primary" />}
      </DropdownMenuItem>

      <DropdownMenuItem onClick={onToggleQR}>
        <QrCode className="w-4 h-4 mr-2" />
        {showQRSidebar ? 'Hide' : 'Show'} QR Sidebar
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={!onThemeOverride}>
          <Palette className="w-4 h-4 mr-2" />
          Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48 max-h-[70vh] overflow-y-auto">
          <DropdownMenuItem
            onClick={() => onThemeOverride?.(null)}
            disabled={!onThemeOverride}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Session Default
            {!activeThemePreset && <CheckIcon className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Classic</span>
          </div>
          {THEME_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.name}
              onClick={() => onThemeOverride?.(preset)}
              disabled={!onThemeOverride}
            >
              <div
                className="w-4 h-4 rounded-full mr-2 border border-white/20 flex-shrink-0"
                style={{ backgroundColor: preset.bg, boxShadow: `inset -3px -3px 0 0 ${preset.accent}` }}
              />
              {preset.name}
              {activeThemePreset === preset.name && <CheckIcon className="w-3 h-3 ml-auto" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <div className="px-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Daycare</span>
          </div>
          {RICH_THEME_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.name}
              onClick={() => onThemeOverride?.(preset)}
              disabled={!onThemeOverride}
            >
              <div
                className="w-5 h-4 rounded mr-2 border border-white/20 flex-shrink-0"
                style={{
                  background: preset.bgGradient ?? preset.bg,
                }}
              />
              {preset.name}
              {activeThemePreset === preset.name && <CheckIcon className="w-3 h-3 ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onClick={() => onResetResults?.()}
        disabled={!onResetResults}
        className="text-amber-500"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset Results
      </DropdownMenuItem>

      <DropdownMenuItem
        onClick={() => onEnd?.()}
        disabled={!onEnd}
        className="text-destructive"
      >
        <StopCircle className="w-4 h-4 mr-2" />
        Stop Presenting
      </DropdownMenuItem>
    </>
  )
}

/* ═══════════════════════════════════════════ */
/*  Full mode — used by presenter.tsx         */
/* ═══════════════════════════════════════════ */

function FullPresenterView({
  session,
  questions,
  activeQuestion,
  activeIndex,
  participantCount,
  joinUrl,
  results,
  showQRSidebar,
  showPercentages = true,
  chartLayout,
  remainingSeconds,
  timerStyle = 'edge',
  autoAdvance,
  branding,
  activeRichTheme,
  activeReaction,
  reactionTriggerKey,
  onTriggerReaction,
  onPrev,
  onNext,
  onSetActiveQuestion,
  onToggleQR,
  onEnd,
  onNavigateBack,
  onTogglePercentages,
  onChartOverride,
  onThemeOverride,
  activeThemePreset,
  onTimerStyleChange,
  onToggleAutoAdvance,
  onResetResults,
  isFullscreen,
  onToggleFullscreen,
  isQuizMode,
  showLeaderboard,
  onToggleLeaderboard,
  leaderboard,
}: PresenterViewProps) {
  const brandingStyle = buildBrandingStyle(branding)
  const richStyles = buildRichThemeStyle(activeRichTheme)

  return (
    <TooltipProvider>
      <div
        className="dark presenter-mode flex flex-col h-screen relative"
        style={{ ...brandingStyle, ...richStyles.rootStyle, ...richStyles.cssVarStyle }}
      >
        {richStyles.patternStyle && (
          <div className="absolute inset-0 z-0 pointer-events-none" style={richStyles.patternStyle} />
        )}
        <div className="absolute inset-0 pointer-events-none z-0" style={richStyles.overlayStyle} />
        <ReactionOverlay reaction={activeReaction} triggerKey={reactionTriggerKey} positioning="fixed" />
        <TimerOverlay
          remainingSeconds={remainingSeconds ?? null}
          totalSeconds={activeQuestion?.timeLimit ?? 0}
          positioning="fixed"
        />

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {onNavigateBack && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onNavigateBack}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to editor (ESC)</TooltipContent>
              </Tooltip>
            )}
            {branding?.brandLogoUrl && (
              <img src={branding.brandLogoUrl} alt="Logo" className="h-7 w-auto object-contain flex-shrink-0" />
            )}
            <span className="text-muted-foreground text-sm font-medium truncate">{session.title}</span>
          </div>

          <div className="flex items-center gap-3 justify-self-end">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <AnimatedCount value={participantCount} className="text-sm font-medium" />
            </div>

            {/* Response progress */}
            {results && participantCount > 0 && (
              <>
                <Separator orientation="vertical" className="h-5 bg-foreground/10" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {results.totalResponses >= participantCount ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                      <circle
                        cx="10" cy="10" r="8" fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 8}
                        strokeDashoffset={2 * Math.PI * 8 * (1 - results.totalResponses / participantCount)}
                        className="transition-all duration-500"
                      />
                    </svg>
                  )}
                  <span className="text-sm font-medium tabular-nums">
                    {results.totalResponses}/{participantCount}
                  </span>
                </div>
              </>
            )}

            <Separator orientation="vertical" className="h-5 bg-foreground/10" />

            {/* QR toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showQRSidebar ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={onToggleQR}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle QR sidebar (Q)</TooltipContent>
            </Tooltip>

            {/* Fullscreen toggle */}
            {onToggleFullscreen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFullscreen ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={onToggleFullscreen}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}</TooltipContent>
              </Tooltip>
            )}

            {/* Presenter menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <PresenterMenuItems
                  activeQuestion={activeQuestion}
                  showPercentages={showPercentages}
                  showQRSidebar={showQRSidebar}
                  chartLayout={chartLayout}
                  timerStyle={timerStyle}
                  autoAdvance={autoAdvance}
                  activeThemePreset={activeThemePreset}
                  onTogglePercentages={onTogglePercentages}
                  onChartOverride={onChartOverride}
                  onToggleQR={onToggleQR}
                  onTimerStyleChange={onTimerStyleChange}
                  onToggleAutoAdvance={onToggleAutoAdvance}
                  onThemeOverride={onThemeOverride}
                  onResetResults={onResetResults}
                  onEnd={onEnd}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            {onEnd && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onEnd}
                className="gap-1.5"
              >
                <StopCircle className="w-3.5 h-3.5" />
                End
              </Button>
            )}
          </div>
        </div>

        {/* Main content with optional QR sidebar */}
        <div className="flex-1 flex min-h-0 relative z-10">
          {/* Question content */}
          <div className="relative flex-1">
            <PresenterTimer
              remainingSeconds={remainingSeconds ?? null}
              totalSeconds={activeQuestion?.timeLimit ?? 0}
              size="lg"
              style={timerStyle}
            />
            <div className="flex flex-col items-center justify-center h-full px-8 lg:px-12 py-6">
              {showLeaderboard && leaderboard ? (
                <div className="w-full max-w-2xl flex flex-col flex-1 min-h-0 animate-fade-in">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-center mb-6">
                    Leaderboard
                  </h2>
                  <div className="flex-1 flex flex-col justify-center min-h-0 overflow-auto">
                    <LeaderboardDisplay entries={leaderboard} size="lg" />
                  </div>
                </div>
              ) : activeQuestion ? (
                <div
                  className="w-full max-w-7xl flex flex-col flex-1 min-h-0"
                >
                  <PresenterQuestionContent
                    key={activeQuestion._id}
                    question={activeQuestion}
                    results={results}
                    chartLayout={chartLayout}
                    showPercentages={showPercentages}
                    size="lg"
                    chartColors={activeRichTheme?.chartColors}
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-lg">No questions to display</p>
              )}
            </div>
          </div>

          {/* QR Sidebar */}
          {showQRSidebar && (
            <div className="w-80 border-l border-white/[0.08] flex flex-col items-center justify-center px-6 py-8 flex-shrink-0">
              <div className="bg-white rounded-xl p-5 mb-4">
                <QRCodeSVG value={joinUrl} size={180} level="M" />
              </div>
              <code className="text-xl font-mono font-bold tracking-[0.2em] text-foreground mb-2">
                {session.code}
              </code>
              <p className="text-xs text-muted-foreground text-center mb-4">
                {window.location.host}
              </p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <AnimatedCount value={participantCount} className="text-sm font-semibold text-foreground" />
                <span className="text-xs">joined</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom navigation — floating glass pill */}
        <div className="flex justify-center px-6 py-4 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-1 rounded-full border border-foreground/[0.08] bg-background/50 backdrop-blur-xl px-2 py-1.5 shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
            {/* Prev */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onPrev}
                  disabled={activeIndex <= 0}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-all disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Previous (&larr;)</TooltipContent>
            </Tooltip>

            {/* Slide indicators */}
            <div className="flex items-center gap-0 px-1 py-1 rounded-full bg-foreground/[0.04]">
              {questions.map((_, i) => {
                const isActive = i === activeIndex
                const isPast = i < activeIndex
                return (
                  <button
                    key={i}
                    onClick={() => onSetActiveQuestion(i)}
                    className="relative flex items-center justify-center w-6 h-6 group"
                  >
                    {/* Track segment */}
                    {i < questions.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-1/2 top-1/2 -translate-y-1/2 h-[2px] w-6 transition-colors duration-300',
                          isPast ? 'bg-primary/40' : 'bg-foreground/[0.06]'
                        )}
                      />
                    )}
                    {/* Dot */}
                    <div
                      className={cn(
                        'relative z-10 rounded-full transition-all duration-300',
                        isActive
                          ? 'w-2.5 h-2.5 bg-primary shadow-[0_0_8px_2px_hsl(var(--primary)/0.5)]'
                          : isPast
                            ? 'w-2 h-2 bg-primary/50 group-hover:bg-primary/70'
                            : 'w-2 h-2 bg-foreground/20 group-hover:bg-foreground/40'
                      )}
                    />
                  </button>
                )
              })}
            </div>

            {/* Next */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onNext}
                  disabled={activeIndex >= questions.length - 1}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-all disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Next (&rarr;)</TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="w-px h-5 bg-foreground/[0.08] mx-1" />

            {/* Reactions */}
            <ReactionToolbar
              onTrigger={onTriggerReaction}
              activeReaction={activeReaction}
            />

            {/* Leaderboard toggle (quiz mode only) */}
            {isQuizMode && onToggleLeaderboard && (
              <>
                <div className="w-px h-5 bg-foreground/[0.08] mx-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleLeaderboard}
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                        showLeaderboard
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08]'
                      )}
                    >
                      <Trophy className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle leaderboard (L)</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Slide counter */}
            <div className="w-px h-5 bg-foreground/[0.08] mx-1" />
            <span className="text-[11px] font-mono tabular-nums text-muted-foreground/60 px-2">
              {activeIndex + 1}<span className="text-foreground/15 mx-0.5">/</span>{questions.length}
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ═══════════════════════════════════════════ */
/*  Compact mode — used by preview.tsx        */
/* ═══════════════════════════════════════════ */

function CompactPresenterView({
  session,
  questions,
  activeQuestion,
  activeIndex,
  participantCount,
  joinUrl,
  results,
  showQRSidebar,
  showPercentages = true,
  chartLayout,
  remainingSeconds,
  timerStyle = 'edge',
  autoAdvance,
  branding,
  activeRichTheme,
  activeReaction,
  reactionTriggerKey,
  onTriggerReaction,
  onPrev,
  onNext,
  onSetActiveQuestion,
  onToggleQR,
  onTogglePercentages,
  onChartOverride,
  onThemeOverride,
  activeThemePreset,
  onTimerStyleChange,
  onToggleAutoAdvance,
  onResetResults,
  onEnd,
}: PresenterViewProps) {
  const compactStyle: React.CSSProperties = branding?.brandBgColor
    ? { background: branding.brandBgColor }
    : { background: 'linear-gradient(135deg, hsl(222 47% 11%) 0%, hsl(217 33% 17%) 100%)' }

  const richStyles = buildRichThemeStyle(activeRichTheme)

  if (branding?.brandBackgroundImageUrl) {
    compactStyle.backgroundImage = `url(${branding.brandBackgroundImageUrl})`
    compactStyle.backgroundSize = 'cover'
    compactStyle.backgroundPosition = 'center'
  }

  return (
    <div
      className="dark flex flex-col h-full relative"
      style={{ ...compactStyle, ...richStyles.rootStyle, ...richStyles.cssVarStyle }}
    >
      {richStyles.patternStyle && (
        <div className="absolute inset-0 z-0 pointer-events-none" style={richStyles.patternStyle} />
      )}
      <div className="absolute inset-0 pointer-events-none z-0" style={richStyles.overlayStyle} />
      <ReactionOverlay reaction={activeReaction} triggerKey={reactionTriggerKey} positioning="absolute" />
      <TimerOverlay
        remainingSeconds={remainingSeconds ?? null}
        totalSeconds={activeQuestion?.timeLimit ?? 0}
        positioning="absolute"
      />

      {/* Mini top bar */}
      <div className="flex items-center justify-between px-2 py-1 flex-shrink-0 relative z-10">
        <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[40%]">
          {session.title}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-2.5 h-2.5" />
            <AnimatedCount value={participantCount} className="text-[9px] font-medium" />
          </div>
          {results && participantCount > 0 && (
            <>
              <div className="w-px h-2.5 bg-foreground/10" />
              <div className="flex items-center gap-0.5 text-muted-foreground">
                {results.totalResponses >= participantCount ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                ) : null}
                <span className="text-[8px] font-medium tabular-nums">
                  {results.totalResponses}/{participantCount}
                </span>
              </div>
            </>
          )}
          <button
            onClick={onToggleQR}
            className={cn(
              'p-0.5 rounded transition-colors',
              showQRSidebar ? 'bg-white/10' : 'hover:bg-white/5'
            )}
          >
            <QrCode className="w-2.5 h-2.5 text-muted-foreground" />
          </button>

          {/* Compact menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-0.5 rounded hover:bg-white/5 transition-colors">
                <MoreVertical className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <PresenterMenuItems
                activeQuestion={activeQuestion}
                showPercentages={showPercentages}
                showQRSidebar={showQRSidebar}
                chartLayout={chartLayout}
                timerStyle={timerStyle}
                autoAdvance={autoAdvance}
                onTogglePercentages={onTogglePercentages}
                onChartOverride={onChartOverride}
                onToggleQR={onToggleQR}
                onTimerStyleChange={onTimerStyleChange}
                onToggleAutoAdvance={onToggleAutoAdvance}
                onResetResults={onResetResults}
                onEnd={onEnd}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-[9px] font-mono text-muted-foreground/80">
            {activeIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 relative z-10">
        <div className="relative flex-1 overflow-hidden">
          <PresenterTimer
            remainingSeconds={remainingSeconds ?? null}
            totalSeconds={activeQuestion?.timeLimit ?? 0}
            size="sm"
            style={timerStyle}
          />
          <div className="flex flex-col items-center justify-center h-full px-3 py-2">
            {activeQuestion ? (
              <div
                className="w-full max-w-[600px] flex flex-col flex-1 min-h-0"
              >
                <PresenterQuestionContent
                  key={activeQuestion._id}
                  question={activeQuestion}
                  results={results}
                  chartLayout={chartLayout}
                  showPercentages={showPercentages}
                  size="sm"
                  chartColors={activeRichTheme?.chartColors}
                />
              </div>
            ) : (
              <p className="text-muted-foreground/40 text-[11px]">No questions to display</p>
            )}
          </div>
        </div>

        {/* Mini QR Sidebar */}
        {showQRSidebar && (
          <div className="w-36 border-l border-white/[0.08] flex flex-col items-center justify-center px-3 py-3 flex-shrink-0">
            <div className="bg-white rounded-md p-2 mb-1.5">
              <QRCodeSVG value={joinUrl} size={80} level="M" />
            </div>
            <code className="text-[9px] font-mono font-bold tracking-[0.1em] text-foreground">
              {session.code}
            </code>
          </div>
        )}
      </div>

      {/* Mini bottom nav — floating glass pill */}
      <div className="flex justify-center px-2 py-1 flex-shrink-0 relative z-10">
        <div className="flex items-center gap-0.5 rounded-full border border-foreground/[0.06] bg-background/40 backdrop-blur-lg px-1.5 py-0.5">
          {/* Prev */}
          <button
            onClick={onPrev}
            disabled={activeIndex <= 0}
            className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-all disabled:opacity-25"
          >
            <ChevronLeft className="w-2.5 h-2.5" />
          </button>

          {/* Slide indicators */}
          <div className="flex items-center px-0.5">
            {questions.map((_, i) => {
              const isActive = i === activeIndex
              const isPast = i < activeIndex
              return (
                <button
                  key={i}
                  onClick={() => onSetActiveQuestion(i)}
                  className="relative flex items-center justify-center w-3 h-4"
                >
                  {i < questions.length - 1 && (
                    <div
                      className={cn(
                        'absolute left-1/2 top-1/2 -translate-y-1/2 h-[1px] w-3 transition-colors duration-300',
                        isPast ? 'bg-primary/40' : 'bg-foreground/[0.06]'
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'relative z-10 rounded-full transition-all duration-300',
                      isActive
                        ? 'w-1.5 h-1.5 bg-primary shadow-[0_0_4px_1px_hsl(var(--primary)/0.5)]'
                        : isPast
                          ? 'w-1 h-1 bg-primary/50'
                          : 'w-1 h-1 bg-foreground/20'
                    )}
                  />
                </button>
              )
            })}
          </div>

          {/* Next */}
          <button
            onClick={onNext}
            disabled={activeIndex >= questions.length - 1}
            className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.08] transition-all disabled:opacity-25"
          >
            <ChevronRight className="w-2.5 h-2.5" />
          </button>

          <div className="w-px h-3 bg-foreground/[0.06] mx-0.5" />

          <ReactionToolbar
            onTrigger={onTriggerReaction}
            activeReaction={activeReaction}
            compact
          />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  Local helper                              */
/* ═══════════════════════════════════════════ */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
