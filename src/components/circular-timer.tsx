import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CircularTimerProps {
  remainingSeconds: number
  totalSeconds: number
  size?: 'sm' | 'lg'
}

type Phase = 'normal' | 'warning' | 'urgent' | 'done'

function getPhase(remaining: number): Phase {
  if (remaining <= 0) return 'done'
  if (remaining <= 5) return 'urgent'
  if (remaining <= 10) return 'warning'
  return 'normal'
}

const PHASE_COLORS = {
  normal:  { arc: 'hsl(var(--primary))',    glow: 'hsl(var(--primary) / 0.4)', text: 'text-primary' },
  warning: { arc: 'rgb(245, 158, 11)',      glow: 'rgba(245, 158, 11, 0.4)',   text: 'text-amber-400' },
  urgent:  { arc: 'rgb(239, 68, 68)',       glow: 'rgba(239, 68, 68, 0.5)',    text: 'text-red-400' },
  done:    { arc: 'rgb(239, 68, 68)',       glow: 'rgba(239, 68, 68, 0.5)',    text: 'text-red-400' },
} as const

export function CircularTimer({ remainingSeconds, totalSeconds, size = 'lg' }: CircularTimerProps) {
  const lg = size === 'lg'
  const diameter = lg ? 96 : 48
  const strokeW = lg ? 4 : 2.5
  const cx = diameter / 2
  const cy = diameter / 2
  const r = (diameter - strokeW * 2) / 2
  const circumference = 2 * Math.PI * r

  const safeTotal = Math.max(1, totalSeconds)
  const fraction = Math.min(1, Math.max(0, remainingSeconds / safeTotal))
  const dashoffset = circumference * (1 - fraction)
  const phase = getPhase(remainingSeconds)
  const colors = PHASE_COLORS[phase]

  // Format display time
  const minute = Math.floor(Math.max(0, remainingSeconds) / 60)
  const second = Math.max(0, remainingSeconds) % 60
  const displayTime = phase === 'done'
    ? "Time's up"
    : minute > 0
      ? `${minute}:${String(second).padStart(2, '0')}`
      : `${second}`

  // Endpoint dot position (angle from top, clockwise)
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  const dotX = cx + r * Math.cos(angle)
  const dotY = cy + r * Math.sin(angle)

  // Flash burst on transition to done
  const [showFlash, setShowFlash] = useState(false)
  const prevPhase = useRef(phase)
  useEffect(() => {
    if (phase === 'done' && prevPhase.current !== 'done') {
      setShowFlash(true)
      const t = setTimeout(() => setShowFlash(false), 700)
      return () => clearTimeout(t)
    }
    prevPhase.current = phase
  }, [phase])

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: diameter,
        height: diameter,
        '--glow-color': colors.glow,
      } as React.CSSProperties}
      role="timer"
      aria-live={phase === 'urgent' ? 'assertive' : 'polite'}
      aria-label={`${remainingSeconds} seconds remaining`}
    >
      <svg
        width={diameter}
        height={diameter}
        className={cn(
          '-rotate-90',
          phase === 'urgent' && 'animate-hud-pulse',
          showFlash && 'animate-hud-flash-burst'
        )}
        style={{ '--glow-color': colors.glow } as React.CSSProperties}
      >
        <defs>
          <filter id={`hud-glow-${size}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={lg ? 3 : 1.5} result="blur" />
            <feComposite in="blur" in2="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeW}
          className="text-foreground/[0.08]"
        />

        {/* Glow layer (behind progress) */}
        {fraction > 0 && phase !== 'done' && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors.arc}
            strokeWidth={strokeW + (lg ? 4 : 2)}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{ opacity: 0.25 }}
            filter={`url(#hud-glow-${size})`}
          />
        )}

        {/* Progress arc */}
        {fraction > 0 && phase !== 'done' && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={colors.arc}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        )}

        {/* Endpoint dot */}
        {fraction > 0 && fraction < 1 && phase !== 'done' && (
          <circle
            cx={dotX}
            cy={dotY}
            r={lg ? 3 : 2}
            fill={colors.arc}
            className="animate-hud-endpoint-glow"
            style={{ filter: `drop-shadow(0 0 ${lg ? 4 : 2}px ${colors.glow})` }}
          />
        )}
      </svg>

      {/* Center text */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center rotate-0',
          phase === 'urgent' && 'animate-hud-heartbeat'
        )}
      >
        <span
          className={cn(
            'font-mono font-bold tabular-nums leading-none',
            colors.text,
            phase === 'done' && lg && 'text-[10px]',
            phase === 'done' && !lg && 'text-[6px]',
            phase !== 'done' && lg && 'text-lg',
            phase !== 'done' && !lg && 'text-[10px]',
            showFlash && 'animate-scale-in'
          )}
        >
          {displayTime}
        </span>
      </div>
    </div>
  )
}
