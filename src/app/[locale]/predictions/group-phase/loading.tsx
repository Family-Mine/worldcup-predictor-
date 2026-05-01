// src/app/[locale]/predictions/group-phase/loading.tsx
import { useTranslations } from 'next-intl'

export default function Loading() {
  return <LoadingInner />
}

function LoadingInner() {
  const t = useTranslations('groupPhase')

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="h-4 w-24 bg-surface-card rounded mb-4 animate-pulse" />
        <div className="h-12 w-2/3 bg-surface-card rounded animate-pulse" />
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-fifa-gold/10 border border-fifa-gold/30 mb-4">
          <svg
            className="w-6 h-6 text-fifa-gold animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-white font-bold mb-1">{t('loading_title')}</p>
        <p className="text-slate-500 text-sm">{t('loading_desc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-card border border-surface-border rounded-xl h-72 animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
