import { useMemo } from 'react'
import { getChartColor } from '@/lib/utils'

interface WordCloudDisplayProps {
  counts: Record<string, number>
  total: number
  size?: 'sm' | 'lg'
}

export function WordCloudDisplay({ counts, total, size = 'sm' }: WordCloudDisplayProps) {
  const isLarge = size === 'lg'

  const words = useMemo(() => {
    const entries = Object.entries(counts)
    if (entries.length === 0) return []

    const maxCount = Math.max(...entries.map(([, c]) => c))
    const minSize = isLarge ? 16 : 14
    const maxSize = isLarge ? 56 : 36

    return entries
      .map(([word, count], i) => ({
        word,
        count,
        size: maxCount > 1
          ? minSize + ((count - 1) / (maxCount - 1)) * (maxSize - minSize)
          : (minSize + maxSize) / 2,
        color: getChartColor(i),
      }))
      .sort((a, b) => b.count - a.count)
  }, [counts, isLarge])

  if (total === 0) {
    const ghostWords = [
      { w: 64, fs: isLarge ? 32 : 22 },
      { w: 40, fs: isLarge ? 18 : 14 },
      { w: 72, fs: isLarge ? 40 : 28 },
      { w: 48, fs: isLarge ? 22 : 16 },
      { w: 56, fs: isLarge ? 28 : 20 },
      { w: 36, fs: isLarge ? 16 : 12 },
      { w: 60, fs: isLarge ? 36 : 24 },
      { w: 44, fs: isLarge ? 20 : 14 },
    ]
    return (
      <div className={`flex flex-wrap items-center justify-center gap-3 px-4 ${isLarge ? 'py-8' : 'py-4'}`}>
        {ghostWords.map((g, i) => (
          <span
            key={i}
            className="inline-block animate-hud-ghost-float"
            style={{ animationDelay: `${i * 350}ms` }}
          >
            <span
              className="block rounded bg-foreground/[0.15]"
              style={{ width: g.w, height: g.fs * 0.6 }}
            />
          </span>
        ))}
        <div className="w-full text-center mt-3">
          <p className={`text-muted-foreground/80 ${isLarge ? 'text-sm' : 'text-xs'} animate-hud-breathe`}>
            Waiting for responses...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 px-4 ${isLarge ? 'py-8' : 'py-4'}`}>
      {words.map(({ word, count, size, color }, i) => (
        <span
          key={i}
          className="inline-block animate-scale-in transition-all cursor-default"
          style={{
            fontSize: `${size}px`,
            color,
            fontWeight: size > 32 ? 700 : 600,
            animationDelay: `${i * 50}ms`,
          }}
          title={`${word} (${count})`}
        >
          {word}
        </span>
      ))}
    </div>
  )
}
