'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, ShoppingBag, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  trackShortView,
  trackShortClick,
  trackShortListingView,
  trackShortListingClick,
} from '@/lib/actions/events'
import { getCategoryBySlug, getConditionBySlug } from '@/lib/constants/categories'
import type {
  ShortWithListing,
  ShortListingWithListing,
  ListingWithImages,
  ListingCategory,
  ListingCondition,
} from '@/lib/types/database'

interface ShortPlayerProps {
  short: ShortWithListing
  isActive: boolean
}

interface ResolvedPin {
  id: string
  start: number | null
  end: number | null
  label: string | null
  listing: ListingWithImages
}

function resolvePins(short: ShortWithListing): ResolvedPin[] {
  const pins = (short.pinned_listings || []) as ShortListingWithListing[]
  if (pins.length > 0) {
    return pins
      .slice()
      .sort((a, b) => a.position - b.position)
      .filter((p): p is ShortListingWithListing & { listing: ListingWithImages } => !!p.listing)
      .map((p) => ({
        id: p.id,
        start: p.start_seconds,
        end: p.end_seconds,
        label: p.label,
        listing: p.listing,
      }))
  }

  const legacy = (Array.isArray(short.listing) ? short.listing[0] : short.listing) as
    | ListingWithImages
    | null
    | undefined
  if (legacy) {
    return [{ id: `legacy-${short.id}`, start: null, end: null, label: null, listing: legacy }]
  }
  return []
}

function findActivePin(pins: ResolvedPin[], time: number): ResolvedPin | null {
  for (const pin of pins) {
    const afterStart = pin.start == null || time >= pin.start
    const beforeEnd = pin.end == null || time < pin.end
    if (afterStart && beforeEnd) return pin
  }
  return null
}

export function ShortPlayer({ short, isActive }: ShortPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasTrackedView = useRef(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [sheetPin, setSheetPin] = useState<ResolvedPin | null>(null)

  const pins = useMemo(() => resolvePins(short), [short])
  const activePin = useMemo(() => findActivePin(pins, currentTime), [pins, currentTime])
  const trackedPinViews = useRef<Set<string>>(new Set())

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(() => {})
      if (!hasTrackedView.current) {
        hasTrackedView.current = true
        trackShortView(short.id)
      }
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive, short.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => setCurrentTime(video.currentTime)
    const onPlay = () => setIsPaused(false)
    const onPause = () => setIsPaused(true)
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  useEffect(() => {
    if (!isActive || !activePin) return
    const key = `${short.id}:${activePin.listing.id}`
    if (trackedPinViews.current.has(key)) return
    trackedPinViews.current.add(key)
    trackShortListingView(short.id, activePin.listing.id)
  }, [isActive, activePin, short.id])

  const handleVideoClick = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  const openProductSheet = (pin: ResolvedPin) => {
    videoRef.current?.pause()
    trackShortClick(short.id, pin.listing.id)
    trackShortListingClick(short.id, pin.listing.id)
    setSheetPin(pin)
  }

  const creator =
    short.creator && !Array.isArray(short.creator)
      ? short.creator
      : Array.isArray(short.creator)
        ? short.creator[0]
        : null
  const creatorName = creator?.display_name || creator?.email?.split('@')[0] || 'Unknown'

  const externalCtaLink =
    short.target_type === 'EXTERNAL' && short.target_external_url
      ? (() => {
          const url = new URL(short.target_external_url)
          url.searchParams.set('utm_source', 'shortlist')
          url.searchParams.set('utm_medium', 'short')
          url.searchParams.set('utm_campaign', short.id)
          return url.toString()
        })()
      : null

  return (
    <div className="relative h-full flex items-center">
      <div className="relative h-full aspect-[9/16] max-h-[calc(100vh-32px)] bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={short.video_url}
          poster={short.poster_url || undefined}
          className="w-full h-full object-cover cursor-pointer"
          loop
          muted
          playsInline
          onClick={handleVideoClick}
        />

        {isPaused && !sheetPin && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center pl-1">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-4 left-4 right-20 z-10">
          <p className="text-white font-semibold mb-1">@{creatorName}</p>
          {short.caption && (
            <p className="text-white/90 text-sm line-clamp-2">{short.caption}</p>
          )}
        </div>

        <div className="absolute right-3 bottom-32 flex flex-col items-center z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white font-bold text-lg">
            {creatorName.charAt(0).toUpperCase()}
          </div>
        </div>

        {activePin && (
          <button
            type="button"
            onClick={() => openProductSheet(activePin)}
            className="absolute bottom-16 left-3 right-3 z-10 flex justify-start animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="bg-white/95 backdrop-blur rounded-lg p-2 flex gap-2 items-center hover:bg-white transition-colors shadow-lg max-w-[280px]">
              {activePin.listing.images?.[0]?.url && (
                <div className="w-10 h-10 relative rounded overflow-hidden shrink-0">
                  <Image
                    src={activePin.listing.images[0].url}
                    alt={activePin.listing.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                {activePin.label && (
                  <p className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                    {activePin.label}
                  </p>
                )}
                <p className="font-medium text-xs text-gray-900 truncate">
                  {activePin.listing.title}
                </p>
                <p className="text-sm font-bold text-gray-900">
                  ${(activePin.listing.price_cents / 100).toFixed(2)}
                </p>
              </div>
              {activePin.listing.status === 'SOLD' ? (
                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                  Sold
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-semibold flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  Shop
                </span>
              )}
            </div>
          </button>
        )}

        {externalCtaLink && (
          <a
            href={externalCtaLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShortClick(short.id)}
            className="absolute bottom-20 left-3 right-3 z-10"
          >
            <div className="bg-primary text-white rounded-xl p-4 text-center font-semibold hover:bg-primary/90 transition-colors">
              Visit Link
            </div>
          </a>
        )}
      </div>

      <ProductSheet
        pin={sheetPin}
        onOpenChange={(open) => {
          if (!open) setSheetPin(null)
        }}
      />
    </div>
  )
}

function ProductSheet({
  pin,
  onOpenChange,
}: {
  pin: ResolvedPin | null
  onOpenChange: (open: boolean) => void
}) {
  const listing = pin?.listing

  return (
    <Sheet open={!!pin} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {listing && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="pr-8">{listing.title}</SheetTitle>
              <SheetDescription>
                ${(listing.price_cents / 100).toFixed(2)}
                {listing.accepts_offers && ' · Accepts offers'}
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-4 space-y-4">
              {listing.images && listing.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {listing.images.slice(0, 3).map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-secondary"
                    >
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 33vw, 200px"
                      />
                    </div>
                  ))}
                </div>
              )}

              <ProductMeta
                category={listing.category as ListingCategory | undefined}
                condition={listing.condition as ListingCondition | undefined}
              />

              {listing.description && (
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {listing.description}
                </p>
              )}

              <div className="grid gap-2">
                {listing.status === 'ACTIVE' ? (
                  <>
                    <form action={`/api/checkout?listing=${listing.id}`} method="POST">
                      <Button type="submit" size="lg" className="w-full h-12 rounded-xl">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Buy Now · ${(listing.price_cents / 100).toFixed(2)}
                      </Button>
                    </form>
                    <Button asChild variant="outline" size="lg" className="w-full h-12 rounded-xl">
                      <Link href={`/listing/${listing.id}`}>
                        {listing.accepts_offers ? 'Make Offer / View Details' : 'View Details'}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center py-3 text-sm">
                    {listing.status}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function ProductMeta({
  category,
  condition,
}: {
  category?: ListingCategory
  condition?: ListingCondition
}) {
  const cat = category ? getCategoryBySlug(category) : null
  const cond = condition ? getConditionBySlug(condition) : null
  if (!cat && !cond) return null
  return (
    <div className="flex flex-wrap gap-2">
      {cat && (
        <Badge variant="secondary" className="gap-1">
          <Tag className="w-3 h-3" />
          {cat.name}
        </Badge>
      )}
      {cond && <Badge variant="outline">{cond.name}</Badge>}
    </div>
  )
}
