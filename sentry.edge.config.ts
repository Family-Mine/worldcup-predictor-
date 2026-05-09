import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    'https://examplePublicKey@o0.ingest.sentry.io/0',

  tracesSampleRate: 0.2,

  environment: process.env.NODE_ENV,

  enabled: process.env.NODE_ENV === 'production',
})
