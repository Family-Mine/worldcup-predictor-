// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' })

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const returnUrl = body.returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'WC26 Predictor — Unlock All Predictions',
            description: 'Access all 104 match predictions for the 2026 FIFA World Cup',
          },
          unit_amount: 499, // $4.99
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      user_email: user.email ?? '',
    },
    customer_email: user.email,
    success_url: `${returnUrl}?unlocked=1`,
    cancel_url: returnUrl,
  })

  return NextResponse.json({ url: session.url })
}
