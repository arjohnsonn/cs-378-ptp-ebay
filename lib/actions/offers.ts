'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Offer, OfferStatus } from '@/lib/types/database'

const OFFER_TTL_HOURS = 48

const amountSchema = z.object({
  amountCents: z.number().int().positive().max(10_000_000),
  message: z.string().max(500).optional(),
})

function expiresAt() {
  return new Date(Date.now() + OFFER_TTL_HOURS * 60 * 60 * 1000).toISOString()
}

async function getAuthedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createOffer(
  listingId: string,
  amountCents: number,
  message?: string
): Promise<{ error?: string; offer?: Offer }> {
  const parsed = amountSchema.safeParse({ amountCents, message })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthedUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, status, accepts_offers, min_offer_cents, price_cents')
    .eq('id', listingId)
    .single()

  if (!listing) return { error: 'Listing not found' }
  if (listing.status !== 'ACTIVE') return { error: 'Listing is not active' }
  if (!listing.accepts_offers) return { error: 'This listing does not accept offers' }
  if (listing.seller_id === user.id) return { error: "You can't make an offer on your own listing" }
  if (amountCents >= listing.price_cents) {
    return { error: 'Offer must be less than the listing price. Use Buy Now instead.' }
  }
  if (listing.min_offer_cents && amountCents < listing.min_offer_cents) {
    return { error: `Offer must be at least $${(listing.min_offer_cents / 100).toFixed(2)}` }
  }

  const { data: existing } = await supabase
    .from('offers')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (existing) {
    return { error: 'You already have a pending offer on this listing. Withdraw it first.' }
  }

  const { data, error } = await supabase
    .from('offers')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount_cents: parsed.data.amountCents,
      from_role: 'BUYER',
      message: parsed.data.message || null,
      expires_at: expiresAt(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/listing/${listingId}`)
  revalidatePath('/offers')
  return { offer: data as Offer }
}

async function transitionOffer(
  offerId: string,
  requiredRole: 'buyer' | 'seller',
  newStatus: OfferStatus
): Promise<{ error?: string; offer?: Offer }> {
  const { supabase, user } = await getAuthedUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: offer } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single()

  if (!offer) return { error: 'Offer not found' }
  if (offer.status !== 'PENDING') return { error: `Offer is already ${offer.status.toLowerCase()}` }

  const expectedUserId = requiredRole === 'buyer' ? offer.buyer_id : offer.seller_id
  if (user.id !== expectedUserId) return { error: 'Not authorized' }

  const { data, error } = await supabase
    .from('offers')
    .update({ status: newStatus })
    .eq('id', offerId)
    .eq('status', 'PENDING')
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/listing/${offer.listing_id}`)
  revalidatePath('/offers')
  return { offer: data as Offer }
}

export async function acceptOffer(offerId: string): Promise<{ error?: string; offer?: Offer }> {
  const { supabase, user } = await getAuthedUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('accept_offer', { p_offer_id: offerId })
  if (error) return { error: error.message }

  const offer = data as Offer
  revalidatePath(`/listing/${offer.listing_id}`)
  revalidatePath('/offers')
  return { offer }
}

export async function declineOffer(offerId: string) {
  return transitionOffer(offerId, 'seller', 'DECLINED')
}

export async function withdrawOffer(offerId: string) {
  return transitionOffer(offerId, 'buyer', 'WITHDRAWN')
}

export async function counterOffer(
  offerId: string,
  amountCents: number,
  message?: string
): Promise<{ error?: string; offer?: Offer }> {
  const parsed = amountSchema.safeParse({ amountCents, message })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supabase, user } = await getAuthedUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: prev } = await supabase
    .from('offers')
    .select('listing_id, buyer_id, seller_id, status, from_role')
    .eq('id', offerId)
    .single()

  if (!prev) return { error: 'Offer not found' }
  if (prev.status !== 'PENDING') return { error: 'Only pending offers can be countered' }

  const isSeller = user.id === prev.seller_id
  const isBuyer = user.id === prev.buyer_id
  if (!isSeller && !isBuyer) return { error: 'Not authorized' }

  const fromRole = isSeller ? 'SELLER' : 'BUYER'

  const { data: listing } = await supabase
    .from('listings')
    .select('status, price_cents')
    .eq('id', prev.listing_id)
    .single()

  if (!listing || listing.status !== 'ACTIVE') return { error: 'Listing is no longer active' }
  if (amountCents >= listing.price_cents) {
    return { error: 'Counter must be less than the listing price' }
  }

  const { data, error } = await supabase.rpc('counter_offer', {
    p_offer_id: offerId,
    p_amount_cents: parsed.data.amountCents,
    p_from_role: fromRole,
    p_message: parsed.data.message || null,
    p_expires_at: expiresAt(),
  })

  if (error) return { error: error.message }

  revalidatePath(`/listing/${prev.listing_id}`)
  revalidatePath('/offers')
  return { offer: data as Offer }
}

export async function getOfferThreadForBuyer(listingId: string): Promise<Offer[]> {
  const { supabase, user } = await getAuthedUser()
  if (!user) return []

  const { data } = await supabase
    .from('offers')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: true })

  return (data || []) as Offer[]
}

export async function getPendingOffersForSeller(listingId: string): Promise<Offer[]> {
  const { supabase, user } = await getAuthedUser()
  if (!user) return []

  const { data } = await supabase
    .from('offers')
    .select('*')
    .eq('listing_id', listingId)
    .eq('seller_id', user.id)
    .in('status', ['PENDING', 'ACCEPTED'])
    .order('created_at', { ascending: false })

  return (data || []) as Offer[]
}

export async function getMyOffers(role: 'buyer' | 'seller') {
  const { supabase, user } = await getAuthedUser()
  if (!user) return []

  const column = role === 'buyer' ? 'buyer_id' : 'seller_id'

  const { data } = await supabase
    .from('offers')
    .select(`
      *,
      listing:listings(id, title, price_cents, status),
      buyer:profiles!offers_buyer_id_fkey(id, display_name, email, avatar_url),
      seller:profiles!offers_seller_id_fkey(id, display_name, email, avatar_url)
    `)
    .eq(column, user.id)
    .order('created_at', { ascending: false })

  return data || []
}
