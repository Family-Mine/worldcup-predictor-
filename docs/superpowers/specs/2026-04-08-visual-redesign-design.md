# Visual Redesign — Design Spec
**Date:** 2026-04-08  
**Feature:** Rediseño visual — tipografía, logo, paleta de botones  
**Status:** Approved

---

## Resumen

Actualización visual de la app manteniendo la paleta oscura + dorado existente. Tres cambios puntuales: tipografía Inter → Space Grotesk, logo ⚽ emoji → diana SVG dorada, y botones CTA amarillo-dorado → verde FIFA. El mood, los colores de fondo y el dorado como acento primario no cambian.

---

## Design tokens

| Token | Valor | Uso |
|-------|-------|-----|
| `surface` | `#0F1117` | Fondo principal (sin cambio) |
| `surface-card` | `#1A1D27` | Cards, panels (sin cambio) |
| `surface-border` | `#2A2D3A` | Bordes (sin cambio) |
| `fifa-gold` | `#D4AF37` | Scores, logo, tabs activos, línea top de cards, separadores (sin cambio) |
| `fifa-green` (nuevo) | `#16A34A` | Botones CTA, badge "guardado ✓", fila "tú" en leaderboard, badges live/activo |
| `fifa-green-dark` | `#B8860B` | Gradiente secundario del logo (stop final del gradiente dorado) |

**Nota:** El token `fifa-green` ya existe en `tailwind.config.ts` con valor `#006847`. Se actualiza a `#16A34A`.

---

## 1. Tipografía

**Cambio:** `Inter` → `Space Grotesk`

- Fuente: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (Google Fonts)
- Pesos usados: `400` (cuerpo), `600` (labels, nav links, nombres), `700` (títulos, scores, botones)
- Aplicación: toda la app — `layout.tsx`, `tailwind.config.ts`, `globals.css`

**Antes:**
```ts
// tailwind.config.ts
fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
```
```tsx
// layout.tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

**Después:**
```ts
fontFamily: { sans: ['Space Grotesk', 'system-ui', 'sans-serif'] }
```
```tsx
import { Space_Grotesk } from 'next/font/google'
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '600', '700'] })
```

---

## 2. Logo

**Cambio:** Emoji `⚽` + texto plano → diana SVG dorada + wordmark en dos líneas

**Concepto:** Anillos concéntricos (target/diana) en dorado. Refuerza el concepto de predicción exacta.

**SVG del logo mark:**
```svg
<svg width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="13" fill="none" stroke="#D4AF37" stroke-width="2"/>
  <circle cx="16" cy="16" r="7.5" fill="none" stroke="#B8860B" stroke-width="1.5" opacity="0.6"/>
  <circle cx="16" cy="16" r="2.8" fill="#D4AF37"/>
</svg>
```

**Wordmark:**
- Línea 1: `WC26` — Space Grotesk 700, `#FFFFFF`, `font-size: 16px`, `letter-spacing: -0.5px`
- Línea 2: `PREDICTOR` — Space Grotesk 600, `#D4AF37`, `font-size: 9px`, `letter-spacing: 2.5px`, `text-transform: uppercase`

**Implementación:** Componente `<LogoMark>` en `src/components/layout/LogoMark.tsx` (SVG inline, sin dependencias de imagen).

**Variantes:**
- Navbar: 32×32px mark + wordmark dos líneas
- Favicon: SVG exportado como `public/favicon.svg` — solo el mark (sin texto)

---

## 3. Botones CTA

**Cambio:** `bg-fifa-gold text-black` → `bg-fifa-green text-white`

El dorado se reserva exclusivamente para: logo, scores de partidos, tabs activos, línea superior de cards, y texto de acento. Los botones de acción usan verde FIFA para separar semánticamente "interacción" de "dato".

**Clases afectadas (reemplazar en todos los archivos):**
- `bg-fifa-gold text-black` → `bg-fifa-green text-white` (botones primarios)
- `hover:bg-yellow-400` → `hover:bg-green-500`
- `text-fifa-gold hover:text-yellow-300` (nav link "Group Bundle") → `text-fifa-green hover:text-green-400`

**Botones secundarios (outline):** sin cambio — siguen siendo `border-surface-border text-slate-300`.

---

## 4. Línea dorada superior en cards

**Cambio:** Agregar `before:` pseudo-elemento con gradiente dorado en todos los `match-card` y panels principales.

Ya implementado en `PicksGrid.tsx` para la fase knockout. Se extiende al resto de cards de partidos y al hero de la landing.

```tsx
// Patrón: card con línea dorada arriba
<div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden relative">
  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-fifa-gold to-yellow-700" />
  {/* contenido */}
</div>
```

---

## 5. Leaderboard — fila "tú"

**Cambio:** El highlight de la fila del usuario activo cambia de dorado a verde.

- Antes: `bg-fifa-gold/5 border-l-2 border-l-fifa-gold` + nombre en `text-fifa-gold`
- Después: `bg-fifa-green/5 border-l-2 border-l-fifa-green` + nombre en `text-fifa-green`

---

## 6. Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `tailwind.config.ts` | `fontFamily` → Space Grotesk; `fifa-green` → `#16A34A` |
| `src/app/globals.css` | Font-family → Space Grotesk |
| `src/app/[locale]/layout.tsx` | Import `Space_Grotesk` de next/font/google |
| `src/components/layout/Navbar.tsx` | Logo: emoji → `<LogoMark>`; botón Register: gold → green |
| `src/components/layout/LogoMark.tsx` | **Crear** — SVG diana dorada + wordmark |
| `src/app/[locale]/page.tsx` | CTAs hero: gold → green; badge "live" → green |
| `src/components/pools/PoolLeaderboard.tsx` | Fila "tú": gold → green; tab activo en leaderboard ya es gold (mantener) |
| `src/app/[locale]/pools/[poolId]/picks/page.tsx` | Tab activo → mantener gold; botones → green si los hay |
| `src/app/[locale]/login/page.tsx` | Botón submit → green |
| `src/app/[locale]/register/page.tsx` | Botón submit → green |
| `src/app/[locale]/pools/new/page.tsx` | Botón → green |
| `src/app/[locale]/pools/join/page.tsx` | Botón → green |

---

## 7. Lo que NO cambia

- Paleta de fondos: `#0F1117`, `#1A1D27`, `#2A2D3A`
- Dorado `#D4AF37`: logo mark, scores de partidos, tabs activos en leaderboard, línea top de cards
- Sistema de puntos, lógica de quinelas, DB schema
- Layout general (navbar sticky, max-w-7xl, footer)
- Stripe, Supabase, next-intl

---

## 8. Orden de implementación

1. `tailwind.config.ts` + `globals.css` + `layout.tsx` — tipografía base (1 commit)
2. `LogoMark.tsx` + `Navbar.tsx` — logo nuevo (1 commit)
3. Botones CTA: `page.tsx` home, login, register, pools/new, pools/join (1 commit)
4. `PoolLeaderboard.tsx` — fila "tú" en verde (1 commit)
5. Línea dorada en cards: `page.tsx` grupo, match detail (1 commit)
