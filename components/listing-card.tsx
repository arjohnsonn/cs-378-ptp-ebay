import Link from 'next/link'
import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ListingWithImages } from '@/lib/types/database'

interface ListingCardProps {
  listing: ListingWithImages
  href?: string
}

export function ListingCard({ listing, href }: ListingCardProps) {
  const imageUrl = listing.images?.[0]?.url
  const price = (listing.price_cents / 100).toFixed(2)
  const linkHref = href || `/listing/${listing.id}`

  return (
    <Link href={linkHref} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        {/* Image */}
        <div className="aspect-square relative bg-secondary/30 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30" strokeWidth={1} />
            </div>
          )}

          {/* Sold overlay */}
          {listing.status === 'SOLD' && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <Badge className="bg-foreground text-background text-sm px-4 py-1">SOLD</Badge>
            </div>
          )}

          {/* Quick view button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-background/90 backdrop-blur-sm text-foreground text-sm font-medium px-4 py-2 rounded-full shadow-lg">
              View Details
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <p className="text-lg font-bold text-foreground">${price}</p>
            {listing.images && listing.images.length > 1 && (
              <span className="text-xs text-muted-foreground">
                +{listing.images.length - 1} photos
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
