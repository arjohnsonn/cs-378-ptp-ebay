import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShortsFeed } from '@/components/shorts-feed'
import { Button } from '@/components/ui/button'
import type { ShortWithListing } from '@/lib/types/database'

interface ShortPageProps {
  params: Promise<{ shortId: string }>
}

export default async function ShortPage({ params }: ShortPageProps) {
  const { shortId } = await params
  const supabase = await createClient()

  const { data: short } = await supabase
    .from('shorts')
    .select(`
      *,
      listing:listings!shorts_target_listing_id_fkey(
        *,
        images:listing_images(*)
      ),
      creator:profiles(*)
    `)
    .eq('id', shortId)
    .single()

  if (!short) {
    notFound()
  }

  return (
    <div className="relative bg-black">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-white">
          Shortlist
        </Link>
        <Button asChild size="sm" variant="secondary">
          <Link href="/shorts">View All</Link>
        </Button>
      </div>

      <ShortsFeed shorts={[short as ShortWithListing]} />
    </div>
  )
}
