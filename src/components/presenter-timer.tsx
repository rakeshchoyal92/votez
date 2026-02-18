import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { CircularTimer } from './circular-timer'

export type TimerStyle = 'edge' | 'corner' | 'hud'

export interface PresenterTimerProps {
  remainingSeconds: number | null
  totalSeconds: number
  size?: 'sm' | 'lg'
  style?: TimerStyle
}

/* ═══════════════════════════════════════════ */
/*  Shared timer state computation            */
/* ═══════════════════════════════════════════ */

interface TimerState {
  hasTimer: boolean
  fraction: number
  isUrgent: boolean
  isWarning: boolean
  isDone: boolean
  displayTime: string
  activeSeconds: number
}

function useTimerState(remainingSeconds: number | null, totalSeconds: number): TimerState {
  const hasTimer = totalSeconds > 0 && remainingSeconds !== null
  const safeTotal = Math.max(1, totalSeconds)
  const activeSeconds = hasTimer ? remainingSeconds : 0
  const fraction = hasTimer ? Math.min(1, Math.max(0, activeSeconds / safeTotal)) : 0
  const isUrgent = hasTimer && activeSeconds > 0 && activeSeconds <= 5
  const isWarning = hasTimer && activeSeconds > 5 && activeSeconds <= 10
  const isDone = hasTimer && activeSeconds === 0

  const minute = Math.floor(activeSeconds / 60)
  const second = activeSeconds % 60
  const displayTime = hasTimer
    ? minute > 0
      ? `${minute}:${String(second).padStart(2, '0')}`
      : `${second}s`
    : '--'

  return { hasTimer, fraction, isUrgent, isWarning, isDone, displayTime, activeSeconds }
}

/* ═══════════════════════════════════════════ */
/*  Main component — delegates to sub-timers  */
/* ═══════════════════════════════════════════ */

export function PresenterTimer({
  remainingSeconds,
  totalSeconds,
  size = 'lg',
  style = 'edge',
}: PresenterTimerProps) {
  const state = useTimerState(remainingSeconds, totalSeconds)

  // Always render a stable container so the DOM structure never changes
  if (!state.hasTimer) {
    return <div className="absolute top-0 inset-x-0 pointer-events-none" aria-hidden />
  }

  switch (style) {
    case 'edge':
      return <EdgeTimer state={state} size={size} />
    case 'corner':
      return <CornerTimer state={state} size={size} />
    case 'hud':
      return (
        <div
          className={cn(
            'absolute z-10 pointer-events-none',
            size === 'lg' ? 'top-3 right-3' : 'top-2 right-2'
          )}
        >
          <CircularTimer
            remainingSeconds={state.activeSeconds}
            totalSeconds={totalSeconds}
            size={size}
          />
        </div>
      )
  }
}

/* ═══════════════════════════════════════════ */
/*  Style 1: Edge Progress Bar               */
/* ═══════════════════════════════════════════ */

function EdgeTimer({ state, size }: { state: TimerState; size: 'sm' | 'lg' }) {
  const { fraction, isUrgent, isWarning, isDone, displayTime } = state
  const lg = size === 'lg'

  const gradientClass = isDone
    ? 'from-red-500 to-orange-500'
    : isUrgent
      ? 'from-red-500 to-orange-500'
      : isWarning
        ? 'from-amber-500 to-yellow-400'
        : 'from-primary to-blue-400'

  const glowColor = isDone || isUrgent
    ? 'rgba(239,68,68,0.4)'
    : isWarning
      ? 'rgba(245,158,11,0.4)'
      : 'hsl(var(--primary) / 0.4)'

  const badgeClass = isDone || isUrgent
    ? 'text-red-400 border-red-400/40'
    : isWarning
      ? 'text-amber-400 border-amber-300/40'
      : 'text-primary border-primary/40'

  if (isDone) {
    return (
      <div className="absolute top-0 inset-x-0 z-10 pointer-events-none">
        <div className={cn(lg ? 'h-[3px]' : 'h-[2px]')} />
        <div className="flex justify-end px-3 pt-1.5">
          <span
            className={cn(
              'font-mono font-semibold rounded-full border px-2 py-0.5 backdrop-blur-sm bg-background/40 animate-timer-flash',
              lg ? 'text-[11px]' : 'text-[9px]',
              'text-red-400 border-red-400/40'
            )}
          >
            Time's up
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute top-0 inset-x-0 z-10 pointer-events-none"
      role="timer"
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-label={`${state.activeSeconds} seconds remaining`}
    >
      {/* The bar */}
      <div className={cn('w-full overflow-hidden', lg ? 'h-[3px]' : 'h-[2px]')}>
        <div
          className={cn(
            'h-full bg-gradient-to-r transition-[width] duration-1000 ease-linear',
            gradientClass
          )}
          style={{
            width: `${fraction * 100}%`,
            boxShadow: `0 0 8px ${glowColor}, 0 0 2px ${glowColor}`,
          }}
        />
      </div>

      {/* Seconds badge pinned to the right end */}
      <div className="flex justify-end px-3 pt-1.5">
        <span
          className={cn(
            'font-mono font-semibold tabular-nums rounded-full border px-2 py-0.5 backdrop-blur-sm bg-background/40',
            lg ? 'text-[11px]' : 'text-[9px]',
            badgeClass,
            isUrgent && 'animate-pulse'
          )}
        >
          {displayTime}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  Style 2: Corner HUD Badge               */
/* ═══════════════════════════════════════════ */

function CornerTimer({ state, size }: { state: TimerState; size: 'sm' | 'lg' }) {
  const { fraction, isUrgent, isWarning, isDone, displayTime } = state
  const lg = size === 'lg'

  const strokeColor = isDone || isUrgent
    ? 'rgb(248,113,113)'
    : isWarning
      ? 'rgb(251,191,36)'
      : 'hsl(var(--primary))'

  const textClass = isDone || isUrgent
    ? 'text-red-400'
    : isWarning
      ? 'text-amber-400'
      : 'text-primary'

  // Arc geometry
  const arcSize = lg ? 18 : 14
  const strokeW = lg ? 2 : 1.5
  const r = (arcSize - strokeW) / 2
  const circumference = 2 * Math.PI * r
  const dashoffset = circumference * (1 - fraction)

  const label = isDone ? 'Done' : displayTime

  return (
    <div
      className={cn(
        'absolute z-10 flex items-center gap-1.5 rounded-lg border backdrop-blur-md pointer-events-none',
        'bg-background/60 border-foreground/10',
        lg ? 'top-3 right-3 px-2.5 py-1.5' : 'top-2 right-2 px-1.5 py-1',
        isUrgent && !isDone && 'animate-pulse'
      )}
      role="timer"
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-label={`${state.activeSeconds} seconds remaining`}
    >
      {/* Tiny circular arc */}
      <svg
        width={arcSize}
        height={arcSize}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={arcSize / 2}
          cy={arcSize / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeW}
          className="text-foreground/10"
        />
        {/* Progress */}
        <circle
          cx={arcSize / 2}
          cy={arcSize / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>

      {/* Time text */}
      <span
        className={cn(
          'font-mono font-semibold tabular-nums leading-none',
          lg ? 'text-sm' : 'text-[10px]',
          textClass
        )}
      >
        {label}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  Page-wide cinematic overlay               */
/* ═══════════════════════════════════════════ */

export interface TimerOverlayProps {
  remainingSeconds: number | null
  totalSeconds: number
  /** 'fixed' for full-screen presenter, 'absolute' for compact preview */
  positioning?: 'fixed' | 'absolute'
}

export function TimerOverlay({
  remainingSeconds,
  totalSeconds,
  positioning = 'fixed',
}: TimerOverlayProps) {
  const state = useTimerState(remainingSeconds, totalSeconds)
  const { hasTimer, isWarning, isUrgent, isDone } = state

  // Track the flash: fires once when timer hits 0
  const [showFlash, setShowFlash] = useState(false)
  const prevDone = useRef(false)

  useEffect(() => {
    if (isDone && !prevDone.current) {
      setShowFlash(true)
      const t = setTimeout(() => setShowFlash(false), 800)
      return () => clearTimeout(t)
    }
    if (!isDone) {
      prevDone.current = false
      setShowFlash(false)
    }
    prevDone.current = isDone
  }, [isDone])

  // Always render a stable container so the DOM structure never changes
  if (!hasTimer || (!isWarning && !isUrgent && !isDone && !showFlash)) {
    return <div className="fixed inset-0 pointer-events-none" aria-hidden />
  }

  const posClass = positioning === 'fixed' ? 'fixed' : 'absolute'

  return (
    <>
      {/* ── Layer 1: Vignette ── */}
      <div
        className={cn(
          posClass,
          'inset-0 pointer-events-none z-[5] transition-opacity duration-700',
          isDone
            ? 'opacity-60'
            : isUrgent
              ? 'opacity-100'
              : isWarning
                ? 'opacity-100'
                : 'opacity-0'
        )}
      >
        {/* Radial vignette from edges */}
        <div
          className={cn(
            'absolute inset-0',
            isUrgent || isDone
              ? 'animate-timer-heartbeat'
              : 'animate-timer-vignette-breathe'
          )}
          style={{
            background: isDone
              ? 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(220,38,38,0.18) 100%)'
              : isUrgent
                ? 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(239,68,68,0.22) 100%)'
                : 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(245,158,11,0.12) 100%)',
          }}
        />
      </div>

      {/* ── Layer 2: Edge glow (4 borders) ── */}
      {(isUrgent || isDone) && (
        <div
          className={cn(
            posClass,
            'inset-0 pointer-events-none z-[5]',
            isUrgent && !isDone && 'animate-timer-heartbeat'
          )}
        >
          {/* Top */}
          <div
            className="absolute top-0 inset-x-0 h-[2px]"
            style={{
              background: isDone
                ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)',
              boxShadow: isDone
                ? '0 0 20px 4px rgba(239,68,68,0.3)'
                : '0 0 15px 3px rgba(239,68,68,0.2)',
            }}
          />
          {/* Bottom */}
          <div
            className="absolute bottom-0 inset-x-0 h-[2px]"
            style={{
              background: isDone
                ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)',
              boxShadow: isDone
                ? '0 0 20px 4px rgba(239,68,68,0.3)'
                : '0 0 15px 3px rgba(239,68,68,0.2)',
            }}
          />
          {/* Left */}
          <div
            className="absolute left-0 inset-y-0 w-[2px]"
            style={{
              background: isDone
                ? 'linear-gradient(180deg, transparent, rgba(239,68,68,0.6), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(239,68,68,0.4), transparent)',
              boxShadow: isDone
                ? '0 0 20px 4px rgba(239,68,68,0.3)'
                : '0 0 15px 3px rgba(239,68,68,0.2)',
            }}
          />
          {/* Right */}
          <div
            className="absolute right-0 inset-y-0 w-[2px]"
            style={{
              background: isDone
                ? 'linear-gradient(180deg, transparent, rgba(239,68,68,0.6), transparent)'
                : 'linear-gradient(180deg, transparent, rgba(239,68,68,0.4), transparent)',
              boxShadow: isDone
                ? '0 0 20px 4px rgba(239,68,68,0.3)'
                : '0 0 15px 3px rgba(239,68,68,0.2)',
            }}
          />
        </div>
      )}

      {/* ── Layer 3: Corner hot-spots ── */}
      {isUrgent && !isDone && (
        <div className={cn(posClass, 'inset-0 pointer-events-none z-[5] animate-timer-heartbeat')}>
          <div className="absolute top-0 left-0 w-32 h-32" style={{
            background: 'radial-gradient(circle at 0% 0%, rgba(239,68,68,0.15) 0%, transparent 70%)',
          }} />
          <div className="absolute top-0 right-0 w-32 h-32" style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(239,68,68,0.15) 0%, transparent 70%)',
          }} />
          <div className="absolute bottom-0 left-0 w-32 h-32" style={{
            background: 'radial-gradient(circle at 0% 100%, rgba(239,68,68,0.15) 0%, transparent 70%)',
          }} />
          <div className="absolute bottom-0 right-0 w-32 h-32" style={{
            background: 'radial-gradient(circle at 100% 100%, rgba(239,68,68,0.15) 0%, transparent 70%)',
          }} />
        </div>
      )}

      {/* ── Layer 4: Flash burst at time's up ── */}
      {showFlash && (
        <div
          className={cn(
            posClass,
            'inset-0 pointer-events-none z-[6] animate-timer-flash-burst'
          )}
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25) 0%, rgba(239,68,68,0.12) 40%, transparent 70%)',
          }}
        />
      )}
    </>
  )
}
