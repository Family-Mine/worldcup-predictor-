'use client'
// src/app/[locale]/pools/new/page.tsx
import { useParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { createPool } from '@/app/actions/pools'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('pools')
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-fifa-green text-white font-bold py-3 rounded-xl hover:bg-green-500 transition-colors disabled:opacity-60"
    >
      {pending ? t('creating') : t('create_group')}
    </button>
  )
}

export default function NewPoolPage() {
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('pools')
  const [state, action] = useFormState(createPool, undefined)

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Link href={`/${locale}/pools`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
        {t('back_to_groups')}
      </Link>

      <h1 className="text-3xl font-black text-white mt-6 mb-2">{t('new_group_title')}</h1>
      <p className="text-slate-400 text-sm mb-8">{t('new_group_subtitle')}</p>

      <form action={action} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
            {t('group_name_label')}
          </label>
          <input
            name="name"
            type="text"
            required
            minLength={3}
            maxLength={60}
            placeholder={t('group_name_placeholder')}
            className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-fifa-gold focus:outline-none text-sm"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      <div className="mt-8 p-4 border border-surface-border rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-3">{t('how_it_works')}</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2"><span className="text-fifa-gold">1.</span> {t('step_1')}</li>
          <li className="flex gap-2"><span className="text-fifa-gold">2.</span> {t('step_2')}</li>
          <li className="flex gap-2"><span className="text-fifa-gold">3.</span> {t('step_3')}</li>
          <li className="flex gap-2"><span className="text-fifa-gold">4.</span> {t('step_4')}</li>
          <li className="flex gap-2"><span className="text-fifa-gold">5.</span> {t('step_5')}</li>
        </ul>
      </div>
    </div>
  )
}
