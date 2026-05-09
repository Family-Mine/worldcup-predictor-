'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="max-w-md w-full bg-surface-card border-t-2 border-t-fifa-gold border border-surface-border rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
        <p className="text-slate-400 mb-6">
          An unexpected error occurred. Try again, or come back in a moment.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-5 py-2 rounded-md bg-fifa-gold text-surface font-semibold hover:opacity-90 transition"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-5 py-2 rounded-md border border-surface-border text-slate-200 hover:bg-surface-border/50 transition"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
