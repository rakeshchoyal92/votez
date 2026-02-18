import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCountProps {
  value: number
  className?: string
}

export function AnimatedCount({ value, className }: AnimatedCountProps) {
  const prevRef = useRef(value)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setAnimating(true)
      const timeout = setTimeout(() => setAnimating(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [value])

  return (
    <span className={cn(animating && 'animate-count-tick', className)}>
      {value}
    </span>
  )
}
