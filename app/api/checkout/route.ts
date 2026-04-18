import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import type { Listing, Offer } from '@/lib/types/database'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listing')
  const offerId = searchParams.get('offer')
  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const redirectTo = offerId ? `/offers` : `/listing/${listingId ?? ''}`
    return NextResponse.redirect(`${origin}/login?redirect=${redirectTo}`, { status: 303 })
  }

  if (offerId) {
    return handleOfferCheckout(offerId, user.id, origin, supabase)
  }

  if (!listingId) {
    return NextResponse.redirect(`${origin}/?error=invalid`, { status: 303 })
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
          product_data: { name: listing.title },
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

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function handleOfferCheckout(
  offerId: string,
  userId: string,
  origin: string,
  supabase: SupabaseClient
) {
  const { data: offerData } = await supabase
    .from('offers')
    .select('*, listing:listings(*)')
    .eq('id', offerId)
    .single()

  const offer = offerData as (Offer & { listing: Listing | null }) | null

  if (!offer || !offer.listing) {
    return NextResponse.redirect(`${origin}/offers?error=offer_not_found`, { status: 303 })
  }

  if (offer.buyer_id !== userId) {
    return NextResponse.redirect(`${origin}/offers?error=not_authorized`, { status: 303 })
  }

  if (offer.status !== 'ACCEPTED') {
    return NextResponse.redirect(`${origin}/offers?error=offer_not_payable`, { status: 303 })
  }

  if (offer.listing.status !== 'ACTIVE') {
    return NextResponse.redirect(`${origin}/offers?error=listing_unavailable`, { status: 303 })
  }

  // Idempotency: if a checkout session already exists for this offer, reuse it instead of creating a new order + session.
  if (offer.stripe_checkout_session_id) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(offer.stripe_checkout_session_id)
      if (existing.status === 'open' && existing.url) {
        return NextResponse.redirect(existing.url, { status: 303 })
      }
    } catch {
      // Session retrieval failed — fall through and create a new one.
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: userId,
      listing_id: offer.listing.id,
      seller_id: offer.seller_id,
      amount_cents: offer.amount_cents,
      status: 'PENDING',
    })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.redirect(`${origin}/offers?error=order_failed`, { status: 303 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: offer.listing.title,
            description: 'Accepted offer',
          },
          unit_amount: offer.amount_cents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${origin}/checkout/success?order=${order.id}`,
    cancel_url: `${origin}/offers`,
    metadata: {
      order_id: order.id,
      listing_id: offer.listing.id,
      offer_id: offer.id,
    },
  })

  await supabase
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id)

  await supabase
    .from('offers')
    .update({ stripe_checkout_session_id: session.id, order_id: order.id })
    .eq('id', offer.id)

  return NextResponse.redirect(session.url!, { status: 303 })
}
