export interface ThemePreset {
  name: string
  bg: string
  accent: string
  text: string

  // Rich background
  bgGradient?: string
  bgPattern?: string
  bgPatternSize?: string
  bgPatternOpacity?: number

  // Overlay control
  overlayOpacity?: number
  overlayBlur?: number

  // Typography
  fontFamily?: string
  googleFont?: string
  googleFontWeight?: string

  // Shape
  borderRadius?: string

  // CSS variable overrides (HSL values)
  cssVars?: Record<string, string>

  // Chart colors
  chartColors?: string[]

  // Picker preview
  previewColors?: string[]
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

export const RICH_THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Rainbow',
    bg: '#1a1040',
    accent: '#f59f00',
    text: '#ffffff',
    bgGradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 17%, #48dbfb 34%, #ff9ff3 51%, #54a0ff 68%, #5f27cd 85%, #ff6b6b 100%)',
    bgPattern: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.04) 20px, rgba(255,255,255,0.04) 22px)`,
    bgPatternOpacity: 0.6,
    overlayOpacity: 0.3,
    overlayBlur: 8,
    fontFamily: "'Fredoka', sans-serif",
    googleFont: 'Fredoka',
    googleFontWeight: '400;600;700',
    borderRadius: '1rem',
    cssVars: { '--primary': '45 100% 51%', '--muted-foreground': '0 0% 85%', '--border': '0 0% 100% / 0.12' },
    chartColors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1', '#fd7e14'],
    previewColors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
  },
  {
    name: 'Ocean World',
    bg: '#0a1628',
    accent: '#00d2ff',
    text: '#e0f7fa',
    bgGradient: 'linear-gradient(180deg, #0a1628 0%, #0d2137 30%, #0f3460 60%, #16536e 100%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='120' height='30' viewBox='0 0 120 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 Q15 5 30 15 Q45 25 60 15 Q75 5 90 15 Q105 25 120 15' fill='none' stroke='rgba(0,210,255,0.12)' stroke-width='2'/%3E%3C/svg%3E")`,
    bgPatternSize: '120px 30px',
    bgPatternOpacity: 0.5,
    overlayOpacity: 0.25,
    overlayBlur: 6,
    fontFamily: "'Nunito', sans-serif",
    googleFont: 'Nunito',
    googleFontWeight: '400;600;700',
    borderRadius: '0.75rem',
    cssVars: { '--primary': '187 100% 50%', '--muted-foreground': '187 20% 75%', '--border': '187 100% 50% / 0.12' },
    chartColors: ['#00d2ff', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4', '#023e8a', '#0077b6', '#caf0f8'],
    previewColors: ['#0a1628', '#0f3460', '#00d2ff', '#48cae4'],
  },
  {
    name: 'Jungle Safari',
    bg: '#0a1f0e',
    accent: '#4ade80',
    text: '#ecfdf5',
    bgGradient: 'linear-gradient(160deg, #0a1f0e 0%, #14532d 40%, #1a3a2a 70%, #0f2b1a 100%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 Q35 15 30 25 Q25 15 30 5z' fill='rgba(74,222,128,0.08)'/%3E%3Cpath d='M10 35 Q15 45 10 55 Q5 45 10 35z' fill='rgba(74,222,128,0.06)'/%3E%3Cpath d='M50 30 Q55 40 50 50 Q45 40 50 30z' fill='rgba(74,222,128,0.07)'/%3E%3C/svg%3E")`,
    bgPatternSize: '60px 60px',
    bgPatternOpacity: 0.7,
    overlayOpacity: 0.28,
    overlayBlur: 6,
    fontFamily: "'Bubblegum Sans', cursive",
    googleFont: 'Bubblegum Sans',
    googleFontWeight: '400',
    borderRadius: '0.75rem',
    cssVars: { '--primary': '142 71% 65%', '--muted-foreground': '142 15% 75%', '--border': '142 71% 45% / 0.15' },
    chartColors: ['#4ade80', '#22c55e', '#86efac', '#bbf7d0', '#fbbf24', '#a3e635', '#34d399', '#6ee7b7'],
    previewColors: ['#0a1f0e', '#14532d', '#4ade80', '#a3e635'],
  },
  {
    name: 'Outer Space',
    bg: '#0f0a1e',
    accent: '#a78bfa',
    text: '#f5f3ff',
    bgGradient: 'radial-gradient(ellipse at 30% 20%, #2e1065 0%, #1e1b4b 30%, #0f0a1e 70%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='rgba(255,255,255,0.4)'/%3E%3Ccircle cx='50' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Ccircle cx='30' cy='55' r='1.2' fill='rgba(255,255,255,0.35)'/%3E%3Ccircle cx='70' cy='65' r='0.8' fill='rgba(255,255,255,0.25)'/%3E%3Ccircle cx='65' cy='35' r='1.8' fill='rgba(167,139,250,0.3)'/%3E%3Ccircle cx='20' cy='75' r='1' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E")`,
    bgPatternSize: '80px 80px',
    bgPatternOpacity: 0.8,
    overlayOpacity: 0.22,
    overlayBlur: 4,
    fontFamily: "'Comic Neue', cursive",
    googleFont: 'Comic Neue',
    googleFontWeight: '400;700',
    borderRadius: '1rem',
    cssVars: { '--primary': '263 70% 76%', '--muted-foreground': '260 20% 75%', '--border': '263 70% 60% / 0.12' },
    chartColors: ['#a78bfa', '#818cf8', '#c4b5fd', '#e879f9', '#f0abfc', '#6366f1', '#8b5cf6', '#ddd6fe'],
    previewColors: ['#2e1065', '#1e1b4b', '#a78bfa', '#e879f9'],
  },
  {
    name: 'Candy Land',
    bg: '#1f0a2e',
    accent: '#f472b6',
    text: '#fdf2f8',
    bgGradient: 'linear-gradient(135deg, #6b21a8 0%, #a21caf 30%, #db2777 60%, #f472b6 100%)',
    bgPattern: `radial-gradient(circle 8px at 20px 20px, rgba(255,255,255,0.08) 50%, transparent 50%), radial-gradient(circle 6px at 50px 40px, rgba(255,255,255,0.06) 50%, transparent 50%), radial-gradient(circle 10px at 75px 15px, rgba(255,255,255,0.07) 50%, transparent 50%)`,
    bgPatternSize: '90px 55px',
    bgPatternOpacity: 0.7,
    overlayOpacity: 0.3,
    overlayBlur: 8,
    fontFamily: "'Fredoka', sans-serif",
    googleFont: 'Fredoka',
    googleFontWeight: '400;600;700',
    borderRadius: '1.25rem',
    cssVars: { '--primary': '330 81% 70%', '--muted-foreground': '330 20% 80%', '--border': '330 81% 70% / 0.15' },
    chartColors: ['#f472b6', '#e879f9', '#c084fc', '#fb7185', '#fda4af', '#a78bfa', '#f0abfc', '#fbcfe8'],
    previewColors: ['#6b21a8', '#db2777', '#f472b6', '#e879f9'],
  },
  {
    name: 'Sunshine',
    bg: '#1a1308',
    accent: '#fbbf24',
    text: '#fefce8',
    bgGradient: 'radial-gradient(ellipse at 50% 0%, #f59e0b 0%, #d97706 25%, #92400e 50%, #451a03 80%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='50' viewBox='0 0 100 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40 Q25 30 50 40 Q75 50 100 40' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='3'/%3E%3Cpath d='M0 25 Q25 15 50 25 Q75 35 100 25' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='2'/%3E%3C/svg%3E")`,
    bgPatternSize: '100px 50px',
    bgPatternOpacity: 0.6,
    overlayOpacity: 0.28,
    overlayBlur: 6,
    fontFamily: "'Patrick Hand', cursive",
    googleFont: 'Patrick Hand',
    googleFontWeight: '400',
    borderRadius: '0.75rem',
    cssVars: { '--primary': '43 96% 56%', '--muted-foreground': '43 30% 80%', '--border': '43 96% 56% / 0.15' },
    chartColors: ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a', '#fb923c', '#fdba74', '#d97706', '#fef3c7'],
    previewColors: ['#451a03', '#d97706', '#fbbf24', '#fcd34d'],
  },
  {
    name: 'Fairy Tale',
    bg: '#0f0720',
    accent: '#c084fc',
    text: '#f5f3ff',
    bgGradient: 'linear-gradient(180deg, #1e1048 0%, #2d1b69 30%, #1a0f3c 60%, #0f0720 100%)',
    bgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='rgba(192,132,252,0.3)'/%3E%3Ccircle cx='55' cy='25' r='1.5' fill='rgba(251,191,36,0.35)'/%3E%3Ccircle cx='35' cy='60' r='2.5' fill='rgba(244,114,182,0.25)'/%3E%3Ccircle cx='80' cy='45' r='1.8' fill='rgba(192,132,252,0.28)'/%3E%3Ccircle cx='70' cy='80' r='2' fill='rgba(251,191,36,0.3)'/%3E%3Ccircle cx='20' cy='85' r='1.2' fill='rgba(244,114,182,0.2)'/%3E%3C/svg%3E")`,
    bgPatternSize: '100px 100px',
    bgPatternOpacity: 0.8,
    overlayOpacity: 0.22,
    overlayBlur: 4,
    fontFamily: "'Nunito', sans-serif",
    googleFont: 'Nunito',
    googleFontWeight: '400;600;700',
    borderRadius: '1rem',
    cssVars: { '--primary': '270 80% 76%', '--muted-foreground': '270 20% 78%', '--border': '270 80% 60% / 0.12' },
    chartColors: ['#c084fc', '#f472b6', '#fbbf24', '#a78bfa', '#e879f9', '#818cf8', '#f0abfc', '#ddd6fe'],
    previewColors: ['#1e1048', '#2d1b69', '#c084fc', '#f472b6'],
  },
]

export const ALL_THEME_PRESETS: ThemePreset[] = [...THEME_PRESETS, ...RICH_THEME_PRESETS]

export function findPresetByName(name: string): ThemePreset | undefined {
  return ALL_THEME_PRESETS.find((p) => p.name === name)
}
