import { useState, useCallback, useRef } from 'react'

export type ReactionType = 'drumroll' | 'applause' | 'confetti' | 'hearts'

const AUTO_DISMISS_MS: Record<ReactionType, number> = {
  drumroll: 3500,
  applause: 3000,
  confetti: 4500,
  hearts: 4000,
}

const SOUND_MAP: Partial<Record<ReactionType, string>> = {
  drumroll: '/sounds/drumroll.mp3',
  applause: '/sounds/applause.mp3',
}

export function useReactions() {
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null)
  const [triggerKey, setTriggerKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const dismiss = useCallback(() => {
    setActiveReaction(null)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
  }, [])

  const trigger = useCallback(
    (type: ReactionType) => {
      // Clear any existing reaction
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }

      setActiveReaction(type)
      setTriggerKey((k) => k + 1)

      // Play sound if available
      const soundPath = SOUND_MAP[type]
      if (soundPath) {
        const audio = new Audio(soundPath)
        audio.volume = 0.5
        audio.play().catch(() => {})
        audioRef.current = audio
      }

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        setActiveReaction(null)
        timerRef.current = null
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
      }, AUTO_DISMISS_MS[type])
    },
    []
  )

  return { activeReaction, triggerKey, trigger, dismiss }
}
