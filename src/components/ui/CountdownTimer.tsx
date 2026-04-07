'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  targetDate: string
  labels: { days: string; hours: string; minutes: string; seconds: string }
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function CountdownTimer({ targetDate, labels }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDate))
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!timeLeft) return null

  const units = [
    { value: timeLeft.days, label: labels.days },
    { value: timeLeft.hours, label: labels.hours },
    { value: timeLeft.minutes, label: labels.minutes },
    { value: timeLeft.seconds, label: labels.seconds },
  ]

  return (
    <div className="flex gap-4 justify-center">
      {units.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center bg-surface-card rounded-lg px-4 py-3 min-w-[70px]">
          <span className="text-3xl font-bold text-fifa-gold tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-widest mt-1">{label}</span>
        </div>
      ))}
    </div>
  )
}
