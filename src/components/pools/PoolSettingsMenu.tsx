'use client'
// src/components/pools/PoolSettingsMenu.tsx
import { useState, useTransition, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { renamePool, deletePool } from '@/app/actions/pools'

interface PoolSettingsMenuProps {
  poolId: string
  poolName: string
  locale: string
}

export function PoolSettingsMenu({ poolId, poolName, locale }: PoolSettingsMenuProps) {
  const t = useTranslations('pools')
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'idle' | 'rename' | 'delete'>('idle')
  const [name, setName] = useState(poolName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleRename() {
    setError(null)
    startTransition(async () => {
      const result = await renamePool(poolId, name)
      if (result.error) {
        setError(result.error)
      } else {
        setMode('idle')
        setOpen(false)
        window.location.reload()
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePool(poolId, locale)
    })
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-lg border border-surface-border text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
        aria-label={t('settings')}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>

      {open && mode === 'idle' && (
        <div className="absolute right-0 mt-1 w-44 bg-surface-card border border-surface-border rounded-xl shadow-xl z-10 overflow-hidden">
          <button
            onClick={() => setMode('rename')}
            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            ✏️ {t('rename_group')}
          </button>
          <button
            onClick={() => setMode('delete')}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-surface-border"
          >
            🗑️ {t('delete_group')}
          </button>
        </div>
      )}

      {/* Rename inline modal */}
      {open && mode === 'rename' && (
        <div className="absolute right-0 mt-1 w-72 bg-surface-card border border-surface-border rounded-xl shadow-xl z-10 p-4">
          <p className="text-sm font-semibold text-white mb-3">{t('rename_group')}</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            maxLength={60}
            autoFocus
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:border-fifa-gold focus:outline-none mb-3"
          />
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('idle'); setName(poolName) }}
              className="flex-1 py-1.5 text-xs text-slate-400 border border-surface-border rounded-lg hover:border-slate-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleRename}
              disabled={isPending || !name.trim()}
              className="flex-1 py-1.5 text-xs bg-fifa-green text-white font-bold rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60"
            >
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation inline modal */}
      {open && mode === 'delete' && (
        <div className="absolute right-0 mt-1 w-72 bg-surface-card border border-red-500/30 rounded-xl shadow-xl z-10 p-4">
          <p className="text-sm font-semibold text-white mb-1">{t('delete_confirm_title')}</p>
          <p className="text-xs text-slate-400 mb-4">{t('delete_confirm_desc')}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('idle')}
              className="flex-1 py-1.5 text-xs text-slate-400 border border-surface-border rounded-lg hover:border-slate-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-1.5 text-xs bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {isPending ? '...' : t('delete_group')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
