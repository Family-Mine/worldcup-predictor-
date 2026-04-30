// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function db() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const productType = session.metadata?.product_type ?? 'predictions'

    if (!userId) {
      console.error('[webhook] missing user_id in metadata', session.id)
      return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 })
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true })
    }

    try {
      const supabase = db()

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
              expires_at: '2026-08-01T00:00:00Z',
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
            expires_at: '2026-08-01T00:00:00Z',
          },
          { onConflict: 'user_id' }
        )
        if (subError) throw new Error(`subscriptions upsert: ${subError.message}`)
      }
    } catch (err) {
      console.error('[webhook] DB write failed:', err)
      return NextResponse.json({ error: 'DB write failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
