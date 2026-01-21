'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { ShortTargetType } from '@/lib/types/database'

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
  redirect('/sell/shorts')
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

export async function getShorts(limit = 20) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shorts')
    .select(`
      *,
      listing:listings!shorts_target_listing_id_fkey(
        *,
        images:listing_images(*)
      ),
      creator:profiles(*)
    `)
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
    .select(`
      *,
      listing:listings!shorts_target_listing_id_fkey(
        *,
        images:listing_images(*)
      ),
      creator:profiles(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function incrementShortView(shortId: string) {
  const supabase = await createClient()

  await supabase.rpc('increment_short_view', { short_id: shortId })
}

export async function incrementShortClick(shortId: string) {
  const supabase = await createClient()

  await supabase.rpc('increment_short_click', { short_id: shortId })
}
