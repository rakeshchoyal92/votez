import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate or retrieve a persistent unique ID for this browser
export function getDeviceId(): string {
  const key = 'votez_device_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

// Generate colors for chart bars
const CHART_COLORS = [
  '#4c6ef5', // brand blue
  '#f59f00', // yellow
  '#40c057', // green
  '#fa5252', // red
  '#be4bdb', // purple
  '#15aabf', // cyan
  '#fd7e14', // orange
  '#e64980', // pink
]

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

// Format relative time
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
