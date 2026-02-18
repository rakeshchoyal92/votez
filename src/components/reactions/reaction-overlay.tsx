import { useRef, useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import type { ReactionType } from '@/hooks/useReactions'

interface ReactionOverlayProps {
  reaction: ReactionType | null
  triggerKey: number
  positioning?: 'fixed' | 'absolute'
}

export function ReactionOverlay({
  reaction,
  triggerKey,
  positioning = 'fixed',
}: ReactionOverlayProps) {
  if (!reaction) return null

  return (
    <div
      key={triggerKey}
      className={`${positioning} inset-0 pointer-events-none overflow-hidden`}
      style={{ zIndex: 9999 }}
    >
      {reaction === 'confetti' && <ConfettiAnimation />}
      {reaction === 'hearts' && <HeartsAnimation />}
      {reaction === 'applause' && <ApplauseAnimation />}
      {reaction === 'drumroll' && <DrumrollAnimation />}
    </div>
  )
}

/* ═══════════════════════════════════════════ */
/*  Confetti — multi-wave cannon bursts       */
/* ═══════════════════════════════════════════ */

const CONFETTI_COLORS = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#ff6bd6', '#845ef7', '#ff922b', '#20c997',
]

function ConfettiAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true })
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const fire = (opts: confetti.Options) =>
      myConfetti({ ...opts, colors: CONFETTI_COLORS, disableForReducedMotion: true })

    // Wave 1 — big center burst
    fire({
      particleCount: 100,
      spread: 100,
      origin: { x: 0.5, y: 0.6 },
      startVelocity: 45,
      gravity: 0.8,
      ticks: 300,
      scalar: 1.1,
    })

    // Wave 2 — left cannon
    timeouts.push(setTimeout(() => {
      fire({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        startVelocity: 50,
        gravity: 0.9,
        ticks: 250,
      })
    }, 150))

    // Wave 3 — right cannon
    timeouts.push(setTimeout(() => {
      fire({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        startVelocity: 50,
        gravity: 0.9,
        ticks: 250,
      })
    }, 300))

    // Wave 4 — top shower
    timeouts.push(setTimeout(() => {
      fire({
        particleCount: 80,
        spread: 160,
        origin: { x: 0.5, y: 0 },
        startVelocity: 25,
        gravity: 1.2,
        ticks: 300,
        scalar: 0.9,
      })
    }, 600))

    // Wave 5 — side sparkles
    timeouts.push(setTimeout(() => {
      fire({
        particleCount: 40,
        angle: 55,
        spread: 40,
        origin: { x: 0.1, y: 0.8 },
        startVelocity: 55,
        gravity: 1,
        ticks: 200,
        scalar: 0.8,
      })
      fire({
        particleCount: 40,
        angle: 125,
        spread: 40,
        origin: { x: 0.9, y: 0.8 },
        startVelocity: 55,
        gravity: 1,
        ticks: 200,
        scalar: 0.8,
      })
    }, 900))

    // Wave 6 — final center pop with stars
    timeouts.push(setTimeout(() => {
      fire({
        particleCount: 50,
        spread: 120,
        origin: { x: 0.5, y: 0.5 },
        startVelocity: 35,
        gravity: 0.7,
        ticks: 250,
        shapes: ['star'],
        scalar: 1.3,
      })
    }, 1200))

    return () => {
      timeouts.forEach(clearTimeout)
      myConfetti.reset()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

/* ═══════════════════════════════════════════ */
/*  Hearts — Instagram-Live-style float       */
/*  with wobble, glow, and varied sizes       */
/* ═══════════════════════════════════════════ */

const HEART_EMOJIS = ['❤️', '🧡', '💛', '💚', '💙', '💜', '💖', '💗', '💕', '💞']

function HeartsAnimation() {
  const hearts = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => {
        const wave = i < 12 ? 0 : i < 24 ? 1 : 2
        return {
          id: i,
          emoji: HEART_EMOJIS[i % HEART_EMOJIS.length],
          left: 10 + Math.random() * 80,
          size: 18 + Math.random() * 28,
          delay: wave * 0.6 + Math.random() * 0.8,
          duration: 2.2 + Math.random() * 1.4,
          drift: -30 + Math.random() * 60,
          wobbleAmp: 8 + Math.random() * 20,
          wobbleSpeed: 0.8 + Math.random() * 1.2,
        }
      }),
    []
  )

  return (
    <>
      {/* Soft pink vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255, 100, 150, 0.08) 0%, transparent 60%)',
          animation: 'reaction-vignette 3.5s ease-in-out forwards',
        }}
      />
      {hearts.map((h) => (
        <span
          key={h.id}
          className="absolute"
          style={{
            left: `${h.left}%`,
            bottom: '-40px',
            fontSize: h.size,
            '--drift': `${h.drift}px`,
            '--wobble-amp': `${h.wobbleAmp}px`,
            '--wobble-speed': `${h.wobbleSpeed}s`,
            animation: `reaction-float-up ${h.duration}s cubic-bezier(0.2, 0.8, 0.3, 1) ${h.delay}s forwards`,
            filter: `drop-shadow(0 0 ${4 + h.size * 0.2}px rgba(255, 100, 150, 0.5))`,
          } as React.CSSProperties}
        >
          {h.emoji}
        </span>
      ))}
    </>
  )
}

/* ═══════════════════════════════════════════ */
/*  Applause — clap wave with sparkle burst   */
/* ═══════════════════════════════════════════ */

function ApplauseAnimation() {
  const claps = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        top: 15 + Math.random() * 70,
        size: 24 + Math.random() * 20,
        delay: Math.random() * 0.6,
        scaleDelay: 0.1 + Math.random() * 0.4,
      })),
    []
  )

  const sparkles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.random() * 8,
        delay: 0.2 + Math.random() * 1.5,
        duration: 0.6 + Math.random() * 0.6,
      })),
    []
  )

  return (
    <>
      {/* Warm golden glow — pulsing */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255, 200, 50, 0.1) 0%, transparent 70%)',
          animation: 'reaction-golden-pulse 0.8s ease-in-out 3 forwards',
        }}
      />

      {/* Clap hands — pop in and wobble */}
      {claps.map((c) => (
        <span
          key={c.id}
          className="absolute"
          style={{
            left: `${c.left}%`,
            top: `${c.top}%`,
            fontSize: c.size,
            animation: `reaction-clap-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${c.delay}s both, reaction-clap-wobble 0.3s ease-in-out ${c.delay + 0.4}s 3 both, reaction-clap-fade 0.6s ease-out ${c.delay + 1.6}s forwards`,
          }}
        >
          👏
        </span>
      ))}

      {/* Sparkle particles */}
      {sparkles.map((s) => (
        <div
          key={`sparkle-${s.id}`}
          className="absolute rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: `radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(255, 180, 0, 0) 70%)`,
            animation: `reaction-sparkle ${s.duration}s ease-out ${s.delay}s both`,
          }}
        />
      ))}
    </>
  )
}

/* ═══════════════════════════════════════════ */
/*  Drumroll — dramatic build-up with         */
/*  shockwaves, speed lines, and flash        */
/* ═══════════════════════════════════════════ */

function DrumrollAnimation() {
  const speedLines = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * 360
        return { id: i, angle, delay: Math.random() * 0.3 }
      }),
    []
  )

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Dark dramatic vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.3) 100%)',
          animation: 'reaction-vignette 3s ease-in-out forwards',
        }}
      />

      {/* Shockwave rings — expanding outward */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            border: `2px solid rgba(255, 180, 50, ${0.4 - i * 0.06})`,
            boxShadow: `0 0 15px rgba(255, 180, 50, ${0.15 - i * 0.02}), inset 0 0 15px rgba(255, 180, 50, ${0.05})`,
            animation: `reaction-shockwave 1.2s ease-out ${i * 0.25}s infinite`,
          }}
        />
      ))}

      {/* Speed lines radiating outward */}
      {speedLines.map((line) => (
        <div
          key={`line-${line.id}`}
          className="absolute"
          style={{
            width: 2,
            height: 40,
            background: 'linear-gradient(to bottom, rgba(255, 200, 100, 0.6), transparent)',
            transformOrigin: 'center 80px',
            transform: `rotate(${line.angle}deg)`,
            animation: `reaction-speed-line 0.4s ease-out ${line.delay}s infinite`,
          }}
        />
      ))}

      {/* Drum emoji — intense shake with scale */}
      <div
        className="relative"
        style={{
          animation: 'reaction-drum-bounce 0.15s ease-in-out infinite',
        }}
      >
        {/* Glow behind drum */}
        <div
          className="absolute inset-0 -m-4 rounded-full blur-xl"
          style={{
            background: 'rgba(255, 180, 50, 0.3)',
            animation: 'reaction-glow-pulse 0.3s ease-in-out infinite alternate',
          }}
        />
        <span className="relative text-8xl block" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 180, 50, 0.5))' }}>
          🥁
        </span>
      </div>

      {/* Impact flashes at random positions */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={`flash-${i}`}
          className="absolute"
          style={{
            left: `${20 + Math.sin(i * 1.2) * 30}%`,
            top: `${20 + Math.cos(i * 1.7) * 30}%`,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255, 220, 100, 0.8)',
            boxShadow: '0 0 10px 4px rgba(255, 200, 50, 0.3)',
            animation: `reaction-flash 0.5s ease-out ${0.1 + i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
