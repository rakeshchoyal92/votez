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
    return (
      <div className="text-center py-8">
        <p className={`text-muted-foreground ${isLarge ? 'text-lg' : 'text-sm'}`}>
          No responses yet
        </p>
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
