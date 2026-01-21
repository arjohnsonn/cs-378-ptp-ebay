import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ListingCard } from '@/components/listing-card'
import { Badge } from '@/components/ui/badge'
import type { ListingWithImages } from '@/lib/types/database'

export default async function SellerListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*)
    `)
    .eq('seller_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Button asChild>
          <Link href="/sell/listings/new">New Listing</Link>
        </Button>
      </div>

      {!listings || listings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No listings yet.</p>
          <Button asChild className="mt-4">
            <Link href="/sell/listings/new">Create your first listing</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <div key={listing.id} className="relative">
              <ListingCard
                listing={listing as ListingWithImages}
                href={`/sell/listings/${listing.id}/edit`}
              />
              <Badge
                variant={listing.status === 'ACTIVE' ? 'default' : 'secondary'}
                className="absolute top-2 left-2"
              >
                {listing.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
