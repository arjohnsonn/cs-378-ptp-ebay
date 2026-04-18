import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const orderId = session.metadata?.order_id
    const listingId = session.metadata?.listing_id
    const offerId = session.metadata?.offer_id

    if (!orderId || !listingId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (order?.status === 'PAID') {
      return NextResponse.json({ received: true, message: 'Already processed' })
    }

    await supabase
      .from('orders')
      .update({
        status: 'PAID',
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', orderId)

    await supabase
      .from('listings')
      .update({ status: 'SOLD' })
      .eq('id', listingId)

    if (offerId) {
      await supabase
        .from('offers')
        .update({ status: 'ACCEPTED_PAID' })
        .eq('id', offerId)
    }

    // Listing is sold — decline any other live offers (pending or accepted-but-unpaid).
    const siblingFilter = offerId
      ? supabase.from('offers').update({ status: 'DECLINED' }).eq('listing_id', listingId).neq('id', offerId).in('status', ['PENDING', 'ACCEPTED'])
      : supabase.from('offers').update({ status: 'DECLINED' }).eq('listing_id', listingId).in('status', ['PENDING', 'ACCEPTED'])
    await siblingFilter

    await supabase
      .from('events')
      .insert({
        event_type: 'PURCHASE_SUCCESS',
        order_id: orderId,
        listing_id: listingId,
        metadata: offerId ? { offer_id: offerId } : null,
      })
  }

  return NextResponse.json({ received: true })
}
