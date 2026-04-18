'use server'

import { createClient } from '@/lib/supabase/server'
import type { EventType } from '@/lib/types/database'

export async function trackEvent(
  eventType: EventType,
  data: {
    shortId?: string
    listingId?: string
    orderId?: string
    metadata?: Record<string, unknown>
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('events').insert({
    event_type: eventType,
    user_id: user?.id || null,
    short_id: data.shortId || null,
    listing_id: data.listingId || null,
    order_id: data.orderId || null,
    metadata: data.metadata || null,
  })
}

export async function trackShortView(shortId: string) {
  await trackEvent('SHORT_VIEW', { shortId })
}

export async function trackShortClick(shortId: string, listingId?: string) {
  await trackEvent('SHORT_CLICK', { shortId, listingId })
}

export async function trackShortListingView(shortId: string, listingId: string) {
  await trackEvent('SHORT_LISTING_VIEW', { shortId, listingId })
}

export async function trackShortListingClick(shortId: string, listingId: string) {
  await trackEvent('SHORT_LISTING_CLICK', { shortId, listingId })
}
