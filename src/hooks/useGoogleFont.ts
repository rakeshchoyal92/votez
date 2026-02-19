import { useEffect } from 'react'

const loadedFonts = new Set<string>()

export function useGoogleFont(fontFamily?: string, weights?: string) {
  useEffect(() => {
    if (!fontFamily || loadedFonts.has(fontFamily)) return
    loadedFonts.add(fontFamily)
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weights ?? '400;600;700'}&display=swap`
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }, [fontFamily, weights])
}
