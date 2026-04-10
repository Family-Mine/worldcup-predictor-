# WC26 Predictor

## Comandos
```bash
npm run dev         # http://localhost:3000
npm run build
npm run start
npm run test
npm run test:watch
npm run lint
```

## Stack
- Next.js 14.2.35 · App Router · TypeScript 5 · Tailwind CSS 3.4.1
- Supabase (SSR + JS client) · Anthropic SDK 0.82.0
- Stripe 22.0.0 (pagos + webhooks)
- next-intl 3.26.5 (i18n, rutas bajo `[locale]`)
- Jest 29.7.0 + React Testing Library

## Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

## Arquitectura
```
src/
├── app/[locale]/      ← todas las rutas bajo locale
├── app/api/           ← API routes y webhooks Stripe
├── app/actions/       ← Server Actions
├── components/        ← ui, betting, pools, predictions
├── lib/supabase/      ← cliente de BD
└── types/
```

## Gotchas
- Todas las rutas bajo `[locale]` — no crear rutas fuera de esa carpeta
- Webhooks de Stripe activos — no modificar `/api/webhooks` sin pruebas
- `.env.local` tiene secretos reales — nunca commitear
- i18n con next-intl: todo texto en archivos de mensajes, no hardcodeado
