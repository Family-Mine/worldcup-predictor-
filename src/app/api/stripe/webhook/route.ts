// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const productType = session.metadata?.product_type ?? 'predictions'

    if (userId && session.payment_status === 'paid') {
      const supabase = db()

      if (productType === 'group_bundle') {
        // Group bundle ($9.99) includes base subscription + group phase access
        await Promise.all([
          supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_payment_intent_id: session.payment_intent as string,
              status: 'active',
              expires_at: '2026-08-01T00:00:00Z',
            },
            { onConflict: 'user_id' }
          ),
          supabase.from('user_add_ons').upsert(
            {
              user_id: userId,
              add_on: 'group_bundle',
              stripe_payment_intent_id: session.payment_intent as string,
            },
            { onConflict: 'user_id,add_on' }
          ),
        ])
      } else {
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_payment_intent_id: session.payment_intent as string,
            status: 'active',
            expires_at: '2026-08-01T00:00:00Z',
          },
          { onConflict: 'user_id' }
        )
      }
    }
  }

  return NextResponse.json({ received: true })
}
