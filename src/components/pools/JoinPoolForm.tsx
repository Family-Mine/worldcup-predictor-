'use client'
// src/components/pools/JoinPoolForm.tsx
import { useFormState, useFormStatus } from 'react-dom'
import { joinPool } from '@/app/actions/pools'
import { useTranslations } from 'next-intl'

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('pools')
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-fifa-green text-white font-bold py-3 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-60 text-sm"
    >
      {pending ? t('joining') : t('join_group')}
    </button>
  )
}

export function JoinPoolForm({ locale, code }: { locale: string; code: string }) {
  const [state, action] = useFormState(joinPool, undefined)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="code" value={code} />
      {state?.error && (
        <p className="text-sm text-red-400 text-center">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  )
}

export function JoinPoolFormManual({ locale }: { locale: string }) {
  const t = useTranslations('pools')
  const [state, action] = useFormState(joinPool, undefined)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
          {t('invite_code_label')}
        </label>
        <input
          name="code"
          type="text"
          required
          placeholder="ABCD1234"
          maxLength={8}
          className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none text-sm font-mono uppercase tracking-widest text-center"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  )
}
