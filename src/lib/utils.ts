import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTestTypeLabel(
  playingTime: number,
  recoveryTime: number
): string {
  if (playingTime === 60 && recoveryTime === 30) return 'Super Solo (60s/30s)'
  if (playingTime === 30 && recoveryTime === 60) return 'Speed Solo (30s/60s)'
  if (playingTime === 30 && recoveryTime === 30) return 'Juniors Solo (30s/30s)'
  return `${playingTime}s/${recoveryTime}s`
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
