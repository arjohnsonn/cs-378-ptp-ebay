import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type { Listing } from '@/lib/types/database'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listing')
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  if (!listingId) {
    return NextResponse.redirect(`${origin}/?error=invalid`, { status: 303 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?redirect=/listing/${listingId}`, { status: 303 })
  }

  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'ACTIVE')
    .single()

  const listing = data as Listing | null

  if (!listing) {
    return NextResponse.redirect(`${origin}/listing/${listingId}?error=unavailable`, { status: 303 })
  }

  if (listing.seller_id === user.id) {
    return NextResponse.redirect(`${origin}/listing/${listingId}?error=own_listing`, { status: 303 })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      listing_id: listing.id,
      seller_id: listing.seller_id,
      amount_cents: listing.price_cents,
      status: 'PENDING',
    })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.redirect(`${origin}/listing/${listingId}?error=order_failed`, { status: 303 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
          },
          unit_amount: listing.price_cents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${origin}/checkout/success?order=${order.id}`,
    cancel_url: `${origin}/listing/${listing.id}`,
    metadata: {
      order_id: order.id,
      listing_id: listing.id,
    },
  })

  await supabase
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id)

  return NextResponse.redirect(session.url!, { status: 303 })
}
