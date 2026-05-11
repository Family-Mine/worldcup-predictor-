# Checklist de registro — Afiliados WC26 Predictor

## Información a tener lista antes de empezar

- [ ] Email de contacto: ljaramillo@me.com
- [ ] URL del sitio: https://wc26predictor.com
- [ ] Número de cédula (para Rushbet y Wplay)
- [ ] Cuenta Skrill o Neteller (opcional, para Betsson — o usar wire transfer)
- [ ] PayPal (alternativa para Wplay)

---

## Registro (completar en orden)

| # | Casa | URL | Template | Estado | Link de afiliado obtenido |
|---|------|-----|----------|--------|--------------------------|
| 1 | Rushbet | https://rushbet-app.com.co/programa-de-afiliados/ | emails/rushbet-descripcion.md | ⬜ Pendiente | — |
| 2 | Wplay | https://afiliadosw.co | emails/wplay-descripcion.md | ⬜ Pendiente | — |
| 3 | Codere | https://codere-partners.com/es/register/ | emails/codere-descripcion.md | ⬜ Pendiente | — |
| 4 | Betsson | https://www.betssongroupaffiliates.com/ | emails/betsson-descripcion.md | ⬜ Pendiente | — |
| 5 | Bet365 | https://www.bet365partners.com/en | emails/bet365-descripcion.md | ⬜ Pendiente | — |

---

## Después de cada aprobación

1. Entrar al panel de afiliados de cada casa
2. Generar un link de tracking apuntando a la página principal del sportsbook
3. Copiar el link
4. Abrir `src/components/betting/BettingLinksBar.tsx`
5. Reemplazar el href correspondiente:

```tsx
// Rushbet
href: 'PEGAR_AQUI_LINK_RUSHBET'

// Wplay
href: 'PEGAR_AQUI_LINK_WPLAY'

// Codere
href: 'PEGAR_AQUI_LINK_CODERE'

// Betsson
href: 'PEGAR_AQUI_LINK_BETSSON'

// Bet365
href: 'PEGAR_AQUI_LINK_BET365'
```

6. Hacer deploy: `git add -A && git commit -m "feat: add affiliate tracking links" && git push`

---

## Estados posibles

- ⬜ Pendiente
- 🔄 Formulario enviado — esperando aprobación
- ✅ Aprobado — link activo en producción
- ❌ Rechazado — ver notas
