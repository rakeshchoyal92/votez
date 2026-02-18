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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PresenterQuestionContent } from './presenter-question-content'
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
  onResetResults?: () => void
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
        <DropdownMenuSubContent className="w-44">
          <DropdownMenuItem
            onClick={() => onThemeOverride?.(null)}
            disabled={!onThemeOverride}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Session Default
            {!activeThemePreset && <CheckIcon className="w-3 h-3 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
}: PresenterViewProps) {
  const brandingStyle = buildBrandingStyle(branding)
  const hasBgImage = !!branding?.brandBackgroundImageUrl
  const hasCustomBg = hasBgImage || !!branding?.brandBgColor

  return (
    <TooltipProvider>
      <div className="dark presenter-mode flex flex-col h-screen relative" style={brandingStyle}>
        <div className="absolute inset-0 pointer-events-none z-0 bg-black/55 backdrop-blur-md" />
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
              {activeQuestion ? (
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

  const hasBgImage = !!branding?.brandBackgroundImageUrl
  const hasCustomBg = hasBgImage || !!branding?.brandBgColor

  if (branding?.brandBackgroundImageUrl) {
    compactStyle.backgroundImage = `url(${branding.brandBackgroundImageUrl})`
    compactStyle.backgroundSize = 'cover'
    compactStyle.backgroundPosition = 'center'
  }

  return (
    <div
      className="dark flex flex-col h-full relative"
      style={compactStyle}
    >
      <div className="absolute inset-0 pointer-events-none z-0 bg-black/55 backdrop-blur-md" />
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
