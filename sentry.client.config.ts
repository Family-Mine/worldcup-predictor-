import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    'https://examplePublicKey@o0.ingest.sentry.io/0',

  tracesSampleRate: 0.2,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  environment: process.env.NODE_ENV,

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
    'NetworkError when attempting to fetch resource.',
    'Non-Error promise rejection captured',
  ],

  enabled: process.env.NODE_ENV === 'production',
})
