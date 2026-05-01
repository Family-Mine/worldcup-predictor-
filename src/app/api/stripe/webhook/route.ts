// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function db(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

// Default expiry covers the World Cup final (Jul 19, 2026) plus a safety buffer
// for refunds, disputes, and post-tournament access. Override via env if needed.
const SUBSCRIPTION_EXPIRES_AT =
  process.env.SUBSCRIPTION_EXPIRES_AT ?? '2026-10-01T00:00:00Z'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  let supabase: SupabaseClient
  try {
    supabase = db()
  } catch (err) {
    console.error('[webhook] DB client init failed:', err)
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // Idempotency — Stripe retries on 5xx for up to 3 days. Skip if we've
  // already processed this event id. Insert FIRST so concurrent retries
  // race on the PRIMARY KEY constraint and only one wins.
  const { error: dedupeError } = await supabase
    .from('processed_webhook_events')
    .insert({ event_id: event.id, event_type: event.type })

  if (dedupeError) {
    if (dedupeError.code === '23505') {
      // Duplicate event — already processed (or being processed)
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('[webhook] dedupe insert failed:', dedupeError)
    return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
    } else if (event.type === 'charge.refunded') {
      await handleChargeRefunded(supabase, event.data.object as Stripe.Charge)
    }
    // Other events: insertion already recorded; we ack so Stripe stops retrying.
  } catch (err) {
    console.error(`[webhook] handler ${event.type} failed:`, err)
    // Roll back the dedupe row so a retry can re-attempt.
    await supabase.from('processed_webhook_events').delete().eq('event_id', event.id)
    return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const productType = session.metadata?.product_type ?? 'predictions'

  if (!userId) {
    throw new Error(`missing user_id in metadata for session ${session.id}`)
  }

  if (session.payment_status !== 'paid') {
    return
  }

  const stripeCustomerId =
    typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? '')
  const stripePaymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? '')

  if (productType === 'group_bundle') {
    const [subResult, addOnResult] = await Promise.all([
      supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_payment_intent_id: stripePaymentIntentId,
          status: 'active',
          expires_at: SUBSCRIPTION_EXPIRES_AT,
        },
        { onConflict: 'user_id' }
      ),
      supabase.from('user_add_ons').upsert(
        {
          user_id: userId,
          add_on: 'group_bundle',
          stripe_payment_intent_id: stripePaymentIntentId,
        },
        { onConflict: 'user_id,add_on' }
      ),
    ])
    if (subResult.error) throw new Error(`subscriptions upsert: ${subResult.error.message}`)
    if (addOnResult.error) throw new Error(`user_add_ons upsert: ${addOnResult.error.message}`)
  } else {
    const { error: subError } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_intent_id: stripePaymentIntentId,
        status: 'active',
        expires_at: SUBSCRIPTION_EXPIRES_AT,
      },
      { onConflict: 'user_id' }
    )
    if (subError) throw new Error(`subscriptions upsert: ${subError.message}`)
  }
}

async function handleChargeRefunded(supabase: SupabaseClient, charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? '')

  if (!paymentIntentId) {
    console.warn('[webhook] charge.refunded with no payment_intent', charge.id)
    return
  }

  // Mark subscription refunded and clear the bundle add-on for that PI.
  // Both are scoped by stripe_payment_intent_id so we never touch unrelated rows.
  const [subResult, addOnResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .update({ status: 'refunded' })
      .eq('stripe_payment_intent_id', paymentIntentId),
    supabase
      .from('user_add_ons')
      .delete()
      .eq('stripe_payment_intent_id', paymentIntentId),
  ])

  if (subResult.error) throw new Error(`subscriptions refund update: ${subResult.error.message}`)
  if (addOnResult.error) throw new Error(`user_add_ons refund delete: ${addOnResult.error.message}`)
}
