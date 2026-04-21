'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { WatchlistItemWithListing } from '@/lib/types/database'

export async function addToWatchlist(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', listingId)
    .single()

  if (!listing) return { error: 'Listing not found' }
  if (listing.seller_id === user.id) return { error: "You can't watch your own listing" }

  const { error } = await supabase
    .from('watchlist_items')
    .insert({ user_id: user.id, listing_id: listingId })

  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/watchlist')
  revalidatePath(`/listing/${listingId}`)
  return {}
}

export async function removeFromWatchlist(listingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) return { error: error.message }

  revalidatePath('/watchlist')
  revalidatePath(`/listing/${listingId}`)
  return {}
}

export async function isListingWatched(listingId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('watchlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  return !!data
}

export async function getMyWatchlist(): Promise<WatchlistItemWithListing[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('watchlist_items')
    .select(`
      *,
      listing:listings(
        *,
        images:listing_images(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data || []).filter((item) => item.listing) as WatchlistItemWithListing[]
}

export async function getWatchedListingIds(): Promise<Set<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()

  const { data } = await supabase
    .from('watchlist_items')
    .select('listing_id')
    .eq('user_id', user.id)

  return new Set((data || []).map((row) => row.listing_id))
}
