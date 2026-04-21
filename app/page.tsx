import { createClient } from '@/lib/supabase/server'
import { HomeContent } from '@/components/home-content'
import { getWatchedListingIds } from '@/lib/actions/watchlist'
import type { ListingWithImages, ShortWithListing } from '@/lib/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: listings }, { data: shorts }] = await Promise.all([
    supabase.auth.getUser(),
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

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const randomShort = shorts && shorts.length > 0
    ? shorts[Math.floor(Math.random() * shorts.length)] as ShortWithListing
    : null

  const userInfo = user ? {
    email: user.email!,
    displayName: profile?.display_name,
    avatarUrl: profile?.avatar_url,
  } : null

  const watchedIds = user ? await getWatchedListingIds() : new Set<string>()

  return (
    <HomeContent
      listings={listings as ListingWithImages[] | null}
      randomShort={randomShort}
      user={userInfo}
      watchedListingIds={Array.from(watchedIds)}
    />
  )
}
