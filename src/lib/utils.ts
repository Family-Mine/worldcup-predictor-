// src/lib/utils.ts

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatMatchDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

export function formatMatchDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function getFormColor(result: string): string {
  if (result === 'W') return 'bg-green-500'
  if (result === 'D') return 'bg-yellow-500'
  return 'bg-red-500'
}

export function parseForm(form: string): string[] {
  return form.split('').filter(c => ['W', 'D', 'L'].includes(c))
}

export function calculatePoints(wins: number, draws: number): number {
  return wins * 3 + draws
}
