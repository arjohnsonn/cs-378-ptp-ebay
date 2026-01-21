import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { Filters, FilterTags } from '@/components/filters'
import { SortSelect } from '@/components/sort-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categories, getCategoryBySlug, type CategorySlug } from '@/lib/constants/categories'
import { Search, Clapperboard, SlidersHorizontal, ChevronLeft } from 'lucide-react'
import type { ListingWithImages, ListingCondition } from '@/lib/types/database'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    q?: string
    conditions?: string
    price?: string
    sort?: string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) return { title: 'Category Not Found' }
  return {
    title: `${category.name} - Shortlist`,
    description: category.description
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) {
    notFound()
  }

  const searchParamsData = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`*, images:listing_images(*)`)
    .eq('status', 'ACTIVE')
    .eq('category', slug)

  if (searchParamsData.q) {
    query = query.ilike('title', `%${searchParamsData.q}%`)
  }

  if (searchParamsData.conditions) {
    const conds = searchParamsData.conditions.split(',').filter(Boolean) as ListingCondition[]
    if (conds.length > 0) {
      query = query.in('condition', conds)
    }
  }

  if (searchParamsData.price) {
    const [min, max] = searchParamsData.price.split('-')
    if (min) query = query.gte('price_cents', Number(min))
    if (max) query = query.lte('price_cents', Number(max))
  }

  const sortOrder = searchParamsData.sort || 'newest'
  if (sortOrder === 'price_low') {
    query = query.order('price_cents', { ascending: true })
  } else if (sortOrder === 'price_high') {
    query = query.order('price_cents', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: listings } = await query.limit(50)

  const Icon = category.icon

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="font-bold text-xl tracking-tight text-primary shrink-0">
              Shortlist
            </Link>

            <form action={`/category/${slug}`} className="flex-1 max-w-lg hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder={`Search in ${category.name}...`}
                  defaultValue={searchParamsData.q}
                  className="w-full pl-10 h-10 bg-secondary/50 border-0 rounded-full"
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
                <Link href="/sell">Sell</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Pills */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Link href="/browse">
              <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap">
                All
              </Button>
            </Link>
            {categories.slice(0, -1).map(cat => {
              const CatIcon = cat.icon
              const isActive = cat.slug === slug
              return (
                <Link key={cat.slug} href={`/category/${cat.slug}`}>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full whitespace-nowrap gap-1.5"
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    {cat.name}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="border-b border-border/50 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/browse" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            All Categories
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Filters</h2>
              <Suspense fallback={<div>Loading...</div>}>
                <Filters showCategories={false} currentCategory={slug as CategorySlug} />
              </Suspense>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {listings?.length || 0} listings found
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <Suspense fallback={<div>Loading...</div>}>
                        <Filters showCategories={false} currentCategory={slug as CategorySlug} />
                      </Suspense>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <Suspense fallback={null}>
                  <SortSelect defaultValue={sortOrder} />
                </Suspense>
              </div>
            </div>

            <Suspense fallback={null}>
              <FilterTags />
            </Suspense>

            {!listings || listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">No listings found in {category.name}.</p>
                <Button asChild>
                  <Link href={`/category/${slug}`}>Clear Filters</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing as ListingWithImages} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
