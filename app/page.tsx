import { createClient } from '@/lib/supabase/server'
import { HomeContent } from '@/components/home-content'
import type { ListingWithImages, ShortWithListing } from '@/lib/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: listings }, { data: shorts }] = await Promise.all([
    supabase
      .from('listings')
      .select(`
        *,
        images:listing_images(*)
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('shorts')
      .select(`
        *,
        listing:listings(*,images:listing_images(*)),
        creator:profiles(*)
      `)
      .limit(10)
  ])

  const randomShort = shorts && shorts.length > 0
    ? shorts[Math.floor(Math.random() * shorts.length)] as ShortWithListing
    : null

  return (
    <HomeContent
      listings={listings as ListingWithImages[] | null}
      randomShort={randomShort}
    />
  )
}
