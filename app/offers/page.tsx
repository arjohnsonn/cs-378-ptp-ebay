import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getMyOffers } from '@/lib/actions/offers'
import type { Offer, Profile, Listing } from '@/lib/types/database'

type OfferRow = Offer & {
  listing: Pick<Listing, 'id' | 'title' | 'price_cents' | 'status'> | null
  buyer: Pick<Profile, 'id' | 'display_name' | 'email' | 'avatar_url'> | null
  seller: Pick<Profile, 'id' | 'display_name' | 'email' | 'avatar_url'> | null
}

interface OffersPageProps {
  searchParams: Promise<{ tab?: string; error?: string }>
}

const errorMessages: Record<string, string> = {
  offer_not_found: 'Offer not found.',
  not_authorized: 'You are not authorized to pay this offer.',
  offer_not_payable: 'This offer is no longer payable.',
  listing_unavailable: 'The listing is no longer active.',
  order_failed: 'Could not create order. Please try again.',
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function statusBadge(status: Offer['status']) {
  const map: Record<Offer['status'], { label: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDING: { label: 'Pending', variant: 'secondary' },
    ACCEPTED: { label: 'Accepted', variant: 'default' },
    ACCEPTED_PAID: { label: 'Paid', variant: 'default' },
    DECLINED: { label: 'Declined', variant: 'outline' },
    WITHDRAWN: { label: 'Withdrawn', variant: 'outline' },
    COUNTERED: { label: 'Countered', variant: 'outline' },
    EXPIRED: { label: 'Expired', variant: 'outline' },
  }
  const { label, variant } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const { tab, error } = await searchParams
  const activeTab: 'received' | 'sent' = tab === 'sent' ? 'sent' : 'received'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/offers')

  const offers = (await getMyOffers(activeTab === 'sent' ? 'buyer' : 'seller')) as OfferRow[]

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">
            Shortlist
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Offers</h1>
        <p className="text-muted-foreground mb-6">Manage negotiations with buyers and sellers.</p>

        {error && errorMessages[error] && (
          <div className="mb-4 p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
            {errorMessages[error]}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b">
          <Link
            href="/offers?tab=received"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'received'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Received
          </Link>
          <Link
            href="/offers?tab=sent"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'sent'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Sent
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No offers {activeTab === 'sent' ? 'sent' : 'received'} yet.</p>
            <Button asChild className="mt-4">
              <Link href="/browse">Browse Listings</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => {
              const counterparty = activeTab === 'sent' ? offer.seller : offer.buyer
              const counterpartyLabel = activeTab === 'sent' ? 'Seller' : 'Buyer'
              return (
                <div
                  key={offer.id}
                  className="bg-card border border-border/50 rounded-xl p-4 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${offer.listing_id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {offer.listing?.title || 'Unknown listing'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>
                          {offer.listing ? formatMoney(offer.listing.price_cents) : '—'} asking
                        </span>
                        <span>·</span>
                        <span>
                          {counterpartyLabel}:{' '}
                          {counterparty?.display_name || counterparty?.email?.split('@')[0] || 'Unknown'}
                        </span>
                      </div>
                      {offer.message && (
                        <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2">
                          &ldquo;{offer.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-2 shrink-0">
                      <p className="text-xl font-bold">{formatMoney(offer.amount_cents)}</p>
                      {statusBadge(offer.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                    <span>
                      From {offer.from_role === 'BUYER' ? 'buyer' : 'seller'} ·{' '}
                      {new Date(offer.created_at).toLocaleDateString()}
                    </span>
                    {offer.status === 'ACCEPTED' && activeTab === 'sent' && (
                      <form action={`/api/checkout?offer=${offer.id}`} method="POST">
                        <Button type="submit" size="sm" className="rounded-lg">
                          Pay {formatMoney(offer.amount_cents)}
                        </Button>
                      </form>
                    )}
                    {offer.status === 'PENDING' && (
                      <Link
                        href={`/listing/${offer.listing_id}`}
                        className="text-foreground hover:underline"
                      >
                        Manage →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
