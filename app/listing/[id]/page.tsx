import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageCarousel } from '@/components/image-carousel'
import { OfferPanel } from '@/components/offer-panel'
import { SellerOffersPanel } from '@/components/seller-offers-panel'
import { ReviewsList } from '@/components/reviews-list'
import { StarRating } from '@/components/star-rating'
import { getCategoryBySlug, getConditionBySlug } from '@/lib/constants/categories'
import { getOfferThreadForBuyer, getPendingOffersForSeller } from '@/lib/actions/offers'
import { getReviewsForListing, getSellerRating } from '@/lib/actions/reviews'
import { ArrowLeft, Tag, Sparkles, User, Calendar, Shield } from 'lucide-react'
import type { ListingImage, Profile, ListingCategory, ListingCondition, Offer } from '@/lib/types/database'

interface ListingPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

const errorMessages: Record<string, string> = {
  own_listing: "You can't buy your own listing",
  unavailable: "This listing is no longer available",
  order_failed: "Failed to create order. Please try again.",
  offer_not_payable: "This offer is no longer payable.",
  listing_unavailable: "This listing is no longer active.",
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

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = !!user && user.id === listing.seller_id

  const buyerThread: Offer[] = !isOwner && user ? await getOfferThreadForBuyer(listing.id) : []
  const latestBuyerOffer = buyerThread.length > 0 ? buyerThread[buyerThread.length - 1] : null

  const sellerOffers: Offer[] = isOwner ? await getPendingOffersForSeller(listing.id) : []

  const [listingReviews, sellerRating] = await Promise.all([
    getReviewsForListing(listing.id),
    getSellerRating(listing.seller_id),
  ])

  const price = (listing.price_cents / 100).toFixed(2)
  const images = (listing.images || []) as ListingImage[]
  const seller = (Array.isArray(listing.seller) ? listing.seller[0] : listing.seller) as Profile | null

  const category = listing.category ? getCategoryBySlug(listing.category as ListingCategory) : null
  const condition = listing.condition ? getConditionBySlug(listing.condition as ListingCondition) : null
  const CategoryIcon = category?.icon

  const createdDate = new Date(listing.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="font-bold text-xl text-primary">Shortlist</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images */}
          <div>
            <ImageCarousel images={images} title={listing.title} />
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category Badge */}
            {category && (
              <Link href={`/category/${category.slug}`}>
                <Badge variant="secondary" className="gap-1.5 hover:bg-secondary/80 transition-colors">
                  {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                  {category.name}
                </Badge>
              </Link>
            )}

            {/* Title & Price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{listing.title}</h1>
              <p className="text-3xl sm:text-4xl font-bold text-primary mt-2">${price}</p>
              {listing.status === 'SOLD' && (
                <Badge variant="secondary" className="mt-3 bg-foreground text-background">SOLD</Badge>
              )}
            </div>

            {/* Error Message */}
            {error && errorMessages[error] && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
                {errorMessages[error]}
              </div>
            )}

            {/* Buy + Offer Actions */}
            {listing.status === 'ACTIVE' && !isOwner && (
              <div className="space-y-3">
                <form action={`/api/checkout?listing=${listing.id}`} method="POST">
                  <Button type="submit" size="lg" className="w-full h-14 text-lg rounded-xl">
                    Buy Now · ${price}
                  </Button>
                </form>
                {listing.accepts_offers && (
                  <OfferPanel
                    listingId={listing.id}
                    listingPriceCents={listing.price_cents}
                    minOfferCents={listing.min_offer_cents ?? null}
                    latestOffer={latestBuyerOffer}
                    isAuthenticated={!!user}
                  />
                )}
              </div>
            )}

            {/* Seller view */}
            {isOwner && listing.status === 'ACTIVE' && listing.accepts_offers && (
              <SellerOffersPanel
                offers={sellerOffers}
                listingPriceCents={listing.price_cents}
              />
            )}

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {condition && (
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Condition</span>
                  </div>
                  <p className="font-semibold">{condition.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{condition.description}</p>
                </div>
              )}

              {category && (
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Tag className="w-4 h-4" />
                    <span className="text-xs uppercase tracking-wide">Category</span>
                  </div>
                  <p className="font-semibold">{category.name}</p>
                </div>
              )}

              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Listed</span>
                </div>
                <p className="font-semibold text-sm">{createdDate}</p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Protection</span>
                </div>
                <p className="font-semibold text-sm">Buyer Protected</p>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h2 className="font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Seller Info */}
            {seller && (
              <div className="bg-card border border-border/50 rounded-xl p-5">
                <h2 className="font-semibold mb-3">Seller</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {seller.avatar_url ? (
                      <img src={seller.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{seller.display_name || seller.email?.split('@')[0]}</p>
                    {sellerRating && sellerRating.rating_count > 0 ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating value={sellerRating.rating_avg} readOnly size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {sellerRating.rating_avg.toFixed(1)} · {sellerRating.rating_count}{' '}
                          {sellerRating.rating_count === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(seller.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Reviews</h2>
            {listingReviews.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {listingReviews.length} {listingReviews.length === 1 ? 'review' : 'reviews'}
              </p>
            )}
          </div>
          <ReviewsList
            reviews={listingReviews}
            emptyMessage="No reviews for this listing yet."
          />
        </section>
      </main>
    </div>
  )
}
