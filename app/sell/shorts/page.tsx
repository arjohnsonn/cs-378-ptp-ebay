import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function SellerShortsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: shorts } = await supabase
    .from('shorts')
    .select(`
      *,
      listing:listings!shorts_target_listing_id_fkey(title)
    `)
    .eq('creator_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Shorts</h1>
        <Button asChild>
          <Link href="/sell/shorts/new">New Short</Link>
        </Button>
      </div>

      {!shorts || shorts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No shorts yet.</p>
          <Button asChild className="mt-4">
            <Link href="/sell/shorts/new">Create your first short</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shorts.map((short) => {
            const listing = Array.isArray(short.listing) ? short.listing[0] : short.listing
            return (
              <Link key={short.id} href={`/s/${short.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[9/16] relative bg-black">
                    {short.poster_url ? (
                      <Image
                        src={short.poster_url}
                        alt={short.caption || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <video
                        src={short.video_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2"
                    >
                      {short.target_type}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm truncate">{short.caption || 'No caption'}</p>
                    {listing && (
                      <p className="text-xs text-muted-foreground truncate">
                        → {listing.title}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{short.view_count} views</span>
                      <span>{short.click_count} clicks</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
