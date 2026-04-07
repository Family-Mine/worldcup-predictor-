# WC26 Predictor — Handoff

## Stack
Next.js 14.2 · TypeScript · Tailwind CSS · Supabase (PostgreSQL + RLS) · Stripe · next-intl

## Estructura de rutas
```
/[locale]/                        → Home (predicciones del día)
/[locale]/groups/                 → Grupos del mundial
/[locale]/groups/[letter]/        → Detalle de grupo
/[locale]/matches/[id]/           → Detalle de partido
/[locale]/teams/[id]/             → Detalle de equipo
/[locale]/predictions/group-phase → Predicciones fase de grupos (requiere group_bundle)
/[locale]/pools/                  → Mis quinelas
/[locale]/pools/new/              → Crear quinela
/[locale]/pools/join/             → Unirse con código
/[locale]/pools/[poolId]/         → Home de quinela (leaderboard + invite)
/[locale]/pools/[poolId]/picks/   → Predicciones de la quinela
/[locale]/pools/[poolId]/special/ → Picks especiales (goleador)
/[locale]/login/                  → Login (client-side con createBrowserClient)
/[locale]/register/               → Registro
```

## Base de datos (Supabase)
Tablas principales: `teams`, `matches`, `predictions`, `subscriptions`, `user_add_ons`

Tablas de quinelas: `profiles`, `pools`, `pool_members`, `pool_picks`, `pool_special_picks`, `pool_leaderboard`

Schema de quinelas: `supabase/pools_schema.sql`

### RLS — Puntos críticos
- `pool_members_select` usa función `auth_is_pool_member(pool_id)` (SECURITY DEFINER) para evitar recursión infinita
- `get_pool_id_by_invite_code(p_code text)` (SECURITY DEFINER) — permite que no-miembros busquen pool por invite_code al hacer join
- `pool_leaderboard` tiene políticas SELECT + INSERT + UPDATE (las INSERT/UPDATE se agregaron después del schema inicial)

### Funciones en Supabase
- `auth_is_pool_member(p_pool_id uuid)` — verifica membresía sin recursión RLS
- `get_pool_id_by_invite_code(p_code text)` — lookup de pool para join flow
- `calculate_pool_points(p_match_id, p_actual_home, p_actual_away)` — calcula puntos tras resultado real

## Sistema de suscripciones (Stripe)
- **Base** (`subscription`): $4.99 → acceso a predicciones individuales
- **Group Bundle** (`group_bundle`): $9.99 → incluye base + vista de fase de grupos
- Al comprar `group_bundle`, el webhook otorga AMBAS: `subscriptions` + `user_add_ons`
- Webhook: `src/app/api/stripe/webhook/route.ts`
- Checkout: `src/app/api/stripe/checkout/route.ts`

## Módulo de quinelas — Lógica de puntos
- Marcador exacto = 3 pts
- Ganador correcto (sin marcador exacto) = 1 pt
- Incorrecto = 0 pts
- Picks se cierran 5 min antes del partido (`isMatchLocked` en `src/lib/pools.ts`)
- Score inputs: `type="text" inputMode="numeric"` (no `type="number"` — evita flechas que descentran texto)
- Auto-save en `onBlur` — solo guarda si ambos campos tienen valor

## Archivos clave
| Archivo | Qué hace |
|---------|----------|
| `src/app/actions/pools.ts` | Server actions: createPool, joinPool, submitPick, submitSpecialPick |
| `src/lib/pools.ts` | isMatchLocked, computePoints, inviteUrl |
| `src/types/pools.ts` | Tipos TypeScript del módulo quinelas |
| `src/components/pools/PicksGrid.tsx` | Grid de predicciones por partido |
| `src/components/pools/PoolLeaderboard.tsx` | Tabla de posiciones |
| `src/components/pools/InviteCodeBanner.tsx` | Banner con código + botones copiar |
| `src/components/pools/SpecialPicksForm.tsx` | Formulario goleador |
| `scripts/sync_data_v2.py` | Scraping Wikipedia para stats de equipos (45/48 teams — USA/MX/CA son hosts) |

## Problemas resueltos en sesiones anteriores
1. **RLS recursión infinita** en `pool_members` → fix con SECURITY DEFINER function
2. **joinPool fallaba** para usuarios no-miembros → fix con `get_pool_id_by_invite_code` RPC
3. **pool_leaderboard sin INSERT policy** → filas nunca se creaban al unirse
4. **.next cache corrupto** → solución: `lsof -ti:3000 | xargs kill -9 && rm -rf .next`
5. **Login roto** (campos se limpiaban sin error) → causa raíz era el cache corrupto de Next.js
6. **Group Bundle mostraba $4.99** → se quitó el gate de suscripción base, ahora $9.99 all-inclusive

## Pendientes
- [ ] Traducciones ES para páginas de quinelas (actualmente en español hardcodeado)
- [ ] Deploy a Vercel + configurar Stripe webhook en producción
- [ ] Fase knockout: segunda ronda de quinelas (nueva etapa, reset de picks)
- [ ] Picks especiales: definir fecha de cierre (actualmente siempre visibles)

## Comandos útiles
```bash
# Dev server
npm run dev

# Si el servidor no responde en puerto 3000
lsof -ti:3000 | xargs kill -9 && rm -rf .next && npm run dev

# Sync de datos de equipos desde Wikipedia
python3 scripts/sync_data_v2.py
```

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```
