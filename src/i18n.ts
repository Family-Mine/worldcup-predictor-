// src/i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = requested === 'es' ? 'es' : 'en'

  const messages =
    locale === 'es'
      ? (await import('../messages/es.json')).default
      : (await import('../messages/en.json')).default

  return { locale, messages }
})
