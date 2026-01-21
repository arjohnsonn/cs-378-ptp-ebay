import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageCarousel } from '@/components/image-carousel'
import type { ListingImage, Profile } from '@/lib/types/database'

interface ListingPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

const errorMessages: Record<string, string> = {
  own_listing: "You can't buy your own listing",
  unavailable: "This listing is no longer available",
  order_failed: "Failed to create order. Please try again.",
}

export default async function ListingPage({ params, searchParams }: ListingPageProps) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*),
      seller:profiles(*)
    `)
    .eq('id', id)
    .single()

  if (!listing || (listing.status !== 'ACTIVE' && listing.status !== 'SOLD')) {
    notFound()
  }

  const price = (listing.price_cents / 100).toFixed(2)
  const images = (listing.images || []) as ListingImage[]
  const seller = (Array.isArray(listing.seller) ? listing.seller[0] : listing.seller) as Profile | null

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">Shortlist</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ImageCarousel images={images} title={listing.title} />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              <p className="text-4xl font-bold mt-2">${price}</p>
              {listing.status === 'SOLD' && (
                <Badge variant="secondary" className="mt-2">SOLD</Badge>
              )}
            </div>

            {listing.description && (
              <div>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {seller && (
              <div>
                <h2 className="font-semibold mb-2">Seller</h2>
                <p className="text-muted-foreground">{seller.display_name || seller.email}</p>
              </div>
            )}

            {error && errorMessages[error] && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                {errorMessages[error]}
              </div>
            )}

            {listing.status === 'ACTIVE' && (
              <form action={`/api/checkout?listing=${listing.id}`} method="POST">
                <Button type="submit" size="lg" className="w-full">
                  Buy Now - ${price}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
