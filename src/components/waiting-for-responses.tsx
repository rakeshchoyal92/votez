interface WaitingForResponsesProps {
  size?: 'sm' | 'lg'
}

export function WaitingForResponses({ size = 'lg' }: WaitingForResponsesProps) {
  const isLg = size === 'lg'
  const s = isLg ? 80 : 48
  const r = isLg ? 34 : 20
  const sw = isLg ? 2.5 : 1.8
  const dashLen = 2 * Math.PI * r

  return (
    <div className="w-full flex-1 flex items-center justify-center">
      <div className="relative" style={{ width: s, height: s }}>
        {/* Sonar ripple 1 */}
        <div
          className="absolute inset-0 rounded-full border animate-hud-sonar"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        />
        {/* Sonar ripple 2 */}
        <div
          className="absolute inset-0 rounded-full border animate-hud-sonar"
          style={{ borderColor: 'rgba(255,255,255,0.12)', animationDelay: '1.5s' }}
        />

        <svg
          className="absolute inset-0"
          viewBox={`0 0 ${s} ${s}`}
          fill="none"
          style={{ width: s, height: s }}
        >
          {/* Track ring */}
          <circle
            cx={s / 2}
            cy={s / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={sw}
          />
          {/* Spinning arc */}
          <circle
            cx={s / 2}
            cy={s / 2}
            r={r}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${dashLen * 0.25} ${dashLen * 0.75}`}
            className="animate-hud-arc-spin"
            style={{ transformOrigin: 'center' }}
          />
        </svg>

        {/* Glowing core */}
        <div
          className="absolute animate-hud-core-pulse rounded-full"
          style={{
            width: isLg ? 6 : 4,
            height: isLg ? 6 : 4,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255,255,255,0.7)',
          }}
        />
      </div>
    </div>
  )
}
