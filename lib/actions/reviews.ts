'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Review, ReviewWithDetails, SellerRating } from '@/lib/types/database'

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
})

export async function createReview(
  orderId: string,
  rating: number,
  body?: string
): Promise<{ error?: string; review?: Review }> {
  const parsed = reviewSchema.safeParse({ rating, body })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, listing_id, status')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.buyer_id !== user.id) return { error: 'Not authorized' }
  if (!['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
    return { error: 'You can only review a paid order' }
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return { error: 'You already reviewed this order' }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      order_id: orderId,
      listing_id: order.listing_id,
      buyer_id: user.id,
      seller_id: order.seller_id,
      rating: parsed.data.rating,
      body: parsed.data.body || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath(`/listing/${order.listing_id}`)
  return { review: data as Review }
}

export async function updateReview(
  reviewId: string,
  rating: number,
  body?: string
): Promise<{ error?: string; review?: Review }> {
  const parsed = reviewSchema.safeParse({ rating, body })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('reviews')
    .update({
      rating: parsed.data.rating,
      body: parsed.data.body || null,
    })
    .eq('id', reviewId)
    .eq('buyer_id', user.id)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/orders/${data.order_id}`)
  revalidatePath(`/listing/${data.listing_id}`)
  return { review: data as Review }
}

export async function deleteReview(reviewId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: review } = await supabase
    .from('reviews')
    .select('order_id, listing_id')
    .eq('id', reviewId)
    .eq('buyer_id', user.id)
    .single()

  if (!review) return { error: 'Review not found' }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('buyer_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/orders/${review.order_id}`)
  revalidatePath(`/listing/${review.listing_id}`)
  return {}
}

export async function uploadReviewImage(
  reviewId: string,
  file: File
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: review } = await supabase
    .from('reviews')
    .select('buyer_id, listing_id')
    .eq('id', reviewId)
    .single()

  if (!review || review.buyer_id !== user.id) return { error: 'Not authorized' }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${reviewId}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('review-images')
    .upload(fileName, file)

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('review-images')
    .getPublicUrl(fileName)

  const { data: images } = await supabase
    .from('review_images')
    .select('position')
    .eq('review_id', reviewId)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = images && images.length > 0 ? images[0].position + 1 : 0

  const { error: insertErr } = await supabase
    .from('review_images')
    .insert({ review_id: reviewId, url: publicUrl, position: nextPosition })

  if (insertErr) return { error: insertErr.message }

  revalidatePath(`/listing/${review.listing_id}`)
  return { url: publicUrl }
}

export async function getReviewsForListing(listingId: string): Promise<ReviewWithDetails[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('reviews')
    .select(`
      *,
      images:review_images(*),
      buyer:profiles!reviews_buyer_id_fkey(*)
    `)
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  return (data || []) as ReviewWithDetails[]
}

export async function getReviewsForSeller(sellerId: string, limit = 20): Promise<ReviewWithDetails[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('reviews')
    .select(`
      *,
      images:review_images(*),
      buyer:profiles!reviews_buyer_id_fkey(*)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data || []) as ReviewWithDetails[]
}

export async function getSellerRating(sellerId: string): Promise<SellerRating | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('seller_ratings')
    .select('*')
    .eq('seller_id', sellerId)
    .maybeSingle()

  return (data as SellerRating) || null
}

export async function getReviewForOrder(orderId: string): Promise<Review | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  return (data as Review) || null
}
