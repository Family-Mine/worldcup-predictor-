// src/i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  const messages =
    locale === 'es'
      ? (await import('../messages/es.json')).default
      : (await import('../messages/en.json')).default
  return { messages }
})
