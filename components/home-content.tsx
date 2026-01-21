'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ListingCard } from '@/components/listing-card'
import { ShortPreview } from '@/components/short-preview'
import { FadeIn, FadeInView, SlideIn, motion } from '@/components/motion'
import { Search, Clapperboard, ChevronRight, Package } from 'lucide-react'
import { categories } from '@/lib/constants/categories'
import type { ListingWithImages, ShortWithListing } from '@/lib/types/database'

interface HomeContentProps {
  listings: ListingWithImages[] | null
  randomShort: ShortWithListing | null
}

export function HomeContent({ listings, randomShort }: HomeContentProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 glass border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="font-bold text-xl tracking-tight text-primary shrink-0">
              Shortlist
            </Link>

            <form action="/search" className="flex-1 max-w-lg hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search products..."
                  className="w-full pl-10 h-10 bg-secondary/50 border-0 rounded-full focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/shorts" className="flex items-center gap-2">
                  <Clapperboard className="w-4 h-4" />
                  <span className="hidden md:inline">Shorts</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-5">
                <Link href="/sell">Start Selling</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-xl">
              <FadeIn delay={0.1}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Video-first marketplace
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                  Products that{' '}
                  <span className="text-primary">move</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.3}>
                <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                  Discover unique items through short-form video. See products in action before you buy.
                </p>
              </FadeIn>
              <FadeIn delay={0.4}>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-full px-8 h-12 text-base">
                    <Link href="/shorts">Watch Shorts</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                    <Link href="/sell">Become a Seller</Link>
                  </Button>
                </div>
              </FadeIn>
            </div>

            {randomShort && (
              <SlideIn delay={0.3} className="hidden lg:flex justify-center">
                <ShortPreview short={randomShort} />
              </SlideIn>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-border/50">
        <FadeInView>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Button asChild variant="ghost" className="text-primary">
              <Link href="/browse" className="flex items-center gap-2">
                Browse all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </FadeInView>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {categories.slice(0, -1).map((category, index) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/category/${category.slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary/80 flex items-center justify-center mb-2 group-hover:bg-primary/10 group-hover:scale-105 transition-all">
                    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{category.name}</span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Listings */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeInView>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Fresh Drops</h2>
              <p className="text-muted-foreground mt-1">Latest listings from our sellers</p>
            </div>
            <Button asChild variant="ghost" className="text-primary">
              <Link href="/browse" className="flex items-center gap-2">
                View all
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </FadeInView>

        {!listings || listings.length === 0 ? (
          <FadeInView>
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to list something!</p>
              <Button asChild className="rounded-full">
                <Link href="/sell/listings/new">Create Listing</Link>
              </Button>
            </div>
          </FadeInView>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.25, 0.4, 0.25, 1]
                }}
              >
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">Shortlist</span>
              <span>•</span>
              <span>Video-first marketplace</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">About</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
