'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ListingStatus, ListingCategory, ListingCondition } from '@/lib/types/database'

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  price: z.number().min(0.01, 'Price must be at least $0.01'),
  status: z.enum(['DRAFT', 'ACTIVE']).default('DRAFT'),
  category: z.enum(['electronics', 'fashion', 'home', 'sports', 'collectibles', 'art', 'books', 'music', 'toys', 'other']).default('other'),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).default('good'),
  acceptsOffers: z.boolean().default(false),
  minOffer: z.number().min(0).optional(),
})

function parseListingForm(formData: FormData) {
  const minOfferRaw = formData.get('min_offer')
  const minOffer = minOfferRaw ? parseFloat(minOfferRaw as string) : undefined
  return listingSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    price: parseFloat(formData.get('price') as string),
    status: formData.get('status') || 'DRAFT',
    category: formData.get('category') || 'other',
    condition: formData.get('condition') || 'good',
    acceptsOffers: formData.get('accepts_offers') === 'on',
    minOffer: minOffer && !isNaN(minOffer) ? minOffer : undefined,
  })
}

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const parsed = parseListingForm(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      price_cents: Math.round(parsed.data.price * 100),
      status: parsed.data.status as ListingStatus,
      category: parsed.data.category as ListingCategory,
      condition: parsed.data.condition as ListingCondition,
      accepts_offers: parsed.data.acceptsOffers,
      min_offer_cents: parsed.data.acceptsOffers && parsed.data.minOffer
        ? Math.round(parsed.data.minOffer * 100)
        : null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/sell/listings')
  revalidatePath('/')

  return { id: data.id }
}

export async function updateListing(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const parsed = parseListingForm(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('listings')
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      price_cents: Math.round(parsed.data.price * 100),
      status: parsed.data.status as ListingStatus,
      category: parsed.data.category as ListingCategory,
      condition: parsed.data.condition as ListingCondition,
      accepts_offers: parsed.data.acceptsOffers,
      min_offer_cents: parsed.data.acceptsOffers && parsed.data.minOffer
        ? Math.round(parsed.data.minOffer * 100)
        : null,
    })
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/sell/listings')
  revalidatePath(`/sell/listings/${id}/edit`)
  revalidatePath(`/listing/${id}`)
  revalidatePath('/')

  return { success: true }
}

export async function deleteListing(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('seller_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/sell/listings')
  revalidatePath('/')
  redirect('/sell/listings')
}

export async function uploadListingImage(listingId: string, file: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('seller_id')
    .eq('id', listingId)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return { error: 'Not authorized' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${listingId}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('listing-images')
    .upload(fileName, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('listing-images')
    .getPublicUrl(fileName)

  const { data: images } = await supabase
    .from('listing_images')
    .select('position')
    .eq('listing_id', listingId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = images && images.length > 0 ? images[0].position + 1 : 0

  const { data, error } = await supabase
    .from('listing_images')
    .insert({
      listing_id: listingId,
      url: publicUrl,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/sell/listings/${listingId}/edit`)
  revalidatePath(`/listing/${listingId}`)

  return { data }
}

export async function deleteListingImage(imageId: string, listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('listing_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/sell/listings/${listingId}/edit`)
  revalidatePath(`/listing/${listingId}`)

  return { success: true }
}

export async function getListings(options?: { sellerId?: string; status?: ListingStatus; search?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*)
    `)
    .order('created_at', { ascending: false })

  if (options?.sellerId) {
    query = query.eq('seller_id', options.sellerId)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data
}

export async function getListing(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*),
      seller:profiles(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}
