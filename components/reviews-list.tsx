import Image from 'next/image'
import { StarRating } from '@/components/star-rating'
import { User } from 'lucide-react'
import type { ReviewWithDetails, Profile } from '@/lib/types/database'

interface ReviewsListProps {
  reviews: ReviewWithDetails[]
  emptyMessage?: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ReviewsList({ reviews, emptyMessage = 'No reviews yet.' }: ReviewsListProps) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const buyer = (Array.isArray(review.buyer) ? review.buyer[0] : review.buyer) as
          | Profile
          | undefined
        const name = buyer?.display_name || buyer?.email?.split('@')[0] || 'Anonymous'
        return (
          <article
            key={review.id}
            className="border border-border/50 rounded-xl p-4 bg-card space-y-3"
          >
            <header className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {buyer?.avatar_url ? (
                    <Image
                      src={buyer.avatar_url}
                      alt=""
                      width={36}
                      height={36}
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} readOnly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {review.body && (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{review.body}</p>
            )}

            {review.images && review.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {review.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary hover:opacity-90 transition-opacity"
                  >
                    <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                  </a>
                ))}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
