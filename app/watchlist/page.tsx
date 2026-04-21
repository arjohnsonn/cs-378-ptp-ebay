import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { Button } from '@/components/ui/button'
import { getMyWatchlist } from '@/lib/actions/watchlist'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/watchlist')
  }

  const items = await getMyWatchlist()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="font-bold text-xl text-primary">Shortlist</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Watchlist</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Your watchlist is empty</h2>
            <p className="text-muted-foreground mb-6">
              Tap the heart on any listing to save it here.
            </p>
            <Button asChild className="rounded-full">
              <Link href="/browse">Browse Listings</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ListingCard
                key={item.id}
                listing={item.listing}
                showWatchButton
                watched
                isAuthenticated
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
