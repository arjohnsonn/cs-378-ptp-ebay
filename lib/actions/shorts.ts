'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ShortTargetType } from '@/lib/types/database'

const pinSchema = z.object({
  listingId: z.string().uuid(),
  startSeconds: z.number().min(0).nullable().optional(),
  endSeconds: z.number().min(0).nullable().optional(),
  label: z.string().max(60).nullable().optional(),
}).refine(
  (p) => p.endSeconds == null || p.startSeconds == null || p.endSeconds > p.startSeconds,
  { message: 'End must be after start' }
)

const shortSchema = z.object({
  caption: z.string().max(500).optional(),
  targetType: z.enum(['LISTING', 'EXTERNAL']),
  targetListingId: z.string().uuid().optional(),
  targetExternalUrl: z.string().url().startsWith('https://').optional(),
}).refine(
  (data) => {
    if (data.targetType === 'LISTING') return !!data.targetListingId
    if (data.targetType === 'EXTERNAL') return !!data.targetExternalUrl
    return false
  },
  { message: 'Invalid target configuration' }
)

export async function createShort(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const videoUrl = formData.get('videoUrl') as string
  const posterUrl = formData.get('posterUrl') as string | null

  if (!videoUrl) {
    return { error: 'Video URL is required' }
  }

  const parsed = shortSchema.safeParse({
    caption: formData.get('caption') || undefined,
    targetType: formData.get('targetType'),
    targetListingId: formData.get('targetListingId') || undefined,
    targetExternalUrl: formData.get('targetExternalUrl') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('shorts')
    .insert({
      creator_id: user.id,
      video_url: videoUrl,
      poster_url: posterUrl || null,
      caption: parsed.data.caption || null,
      target_type: parsed.data.targetType as ShortTargetType,
      target_listing_id: parsed.data.targetListingId || null,
      target_external_url: parsed.data.targetExternalUrl || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/sell/shorts')
  revalidatePath('/shorts')
  return { id: data.id }
}

export async function deleteShort(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('shorts')
    .delete()
    .eq('id', id)
    .eq('creator_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/sell/shorts')
  revalidatePath('/shorts')

  return { success: true }
}

export async function uploadVideo(file: File) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const maxSize = 200 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: 'Video must be under 200MB' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('short-videos')
    .upload(fileName, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('short-videos')
    .getPublicUrl(fileName)

  return { url: publicUrl }
}

const shortSelect = `
  *,
  listing:listings!shorts_target_listing_id_fkey(
    *,
    images:listing_images(*)
  ),
  creator:profiles(*),
  pinned_listings:short_listings(
    *,
    listing:listings(
      *,
      images:listing_images(*)
    )
  )
`

export async function getShorts(limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shorts')
    .select(shortSelect)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data
}

export async function getShort(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shorts')
    .select(shortSelect)
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function setShortListings(
  shortId: string,
  pins: Array<{
    listingId: string
    startSeconds?: number | null
    endSeconds?: number | null
    label?: string | null
  }>
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: short } = await supabase
    .from('shorts')
    .select('creator_id')
    .eq('id', shortId)
    .single()

  if (!short) return { error: 'Short not found' }
  if (short.creator_id !== user.id) return { error: 'Not authorized' }

  const validated: Array<z.infer<typeof pinSchema>> = []
  for (const pin of pins) {
    const parsed = pinSchema.safeParse(pin)
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    validated.push(parsed.data)
  }

  const seen = new Set<string>()
  for (const p of validated) {
    if (seen.has(p.listingId)) return { error: 'Each listing can only be pinned once' }
    seen.add(p.listingId)
  }

  const { error: deleteErr } = await supabase
    .from('short_listings')
    .delete()
    .eq('short_id', shortId)

  if (deleteErr) return { error: deleteErr.message }

  if (validated.length > 0) {
    const { error: insertErr } = await supabase
      .from('short_listings')
      .insert(
        validated.map((p, i) => ({
          short_id: shortId,
          listing_id: p.listingId,
          start_seconds: p.startSeconds ?? null,
          end_seconds: p.endSeconds ?? null,
          label: p.label ?? null,
          position: i,
        }))
      )

    if (insertErr) return { error: insertErr.message }
  }

  revalidatePath(`/sell/shorts`)
  revalidatePath('/shorts')
  return { success: true }
}

export async function incrementShortView(shortId: string) {
  const supabase = await createClient()

  await supabase.rpc('increment_short_view', { short_id: shortId })
}

export async function incrementShortClick(shortId: string) {
  const supabase = await createClient()

  await supabase.rpc('increment_short_click', { short_id: shortId })
}
