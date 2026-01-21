'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import { trackShortView, trackShortClick } from '@/lib/actions/events'
import type { ShortWithListing } from '@/lib/types/database'

interface ShortPlayerProps {
  short: ShortWithListing
  isActive: boolean
}

export function ShortPlayer({ short, isActive }: ShortPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasTrackedView, setHasTrackedView] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(() => {})
      setIsPaused(false)
      if (!hasTrackedView) {
        trackShortView(short.id)
        setHasTrackedView(true)
      }
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive, short.id, hasTrackedView])

  const handleVideoClick = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setIsPaused(false)
    } else {
      video.pause()
      setIsPaused(true)
    }
  }

  const handleCTAClick = () => {
    trackShortClick(short.id, short.target_listing_id || undefined)
  }

  const listing = short.listing && !Array.isArray(short.listing) ? short.listing :
    (Array.isArray(short.listing) ? short.listing[0] : null)
  const creator = short.creator && !Array.isArray(short.creator) ? short.creator :
    (Array.isArray(short.creator) ? short.creator[0] : null)

  const getCTALink = () => {
    if (short.target_type === 'LISTING' && listing) {
      return `/listing/${listing.id}`
    }
    if (short.target_type === 'EXTERNAL' && short.target_external_url) {
      const url = new URL(short.target_external_url)
      url.searchParams.set('utm_source', 'shortlist')
      url.searchParams.set('utm_medium', 'short')
      url.searchParams.set('utm_campaign', short.id)
      return url.toString()
    }
    return null
  }

  const ctaLink = getCTALink()
  const creatorName = creator?.display_name || creator?.email?.split('@')[0] || 'Unknown'

  return (
    <div className="relative h-full flex items-center">
      {/* Video Container */}
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

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center pl-1">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Creator info & caption - bottom left */}
        <div className="absolute bottom-4 left-4 right-20 z-10">
          <p className="text-white font-semibold mb-1">@{creatorName}</p>
          {short.caption && (
            <p className="text-white/90 text-sm line-clamp-2">{short.caption}</p>
          )}
        </div>

        {/* Profile avatar - right side */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center z-10">
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white font-bold text-lg">
            {creatorName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Product card - bottom */}
        {ctaLink && short.target_type === 'LISTING' && listing && (
          <Link
            href={ctaLink}
            onClick={handleCTAClick}
            className="absolute bottom-16 left-3 z-10"
          >
            <div className="bg-white/95 backdrop-blur rounded-lg p-2 flex gap-2 items-center hover:bg-white transition-colors shadow-lg max-w-[240px]">
              {listing.images?.[0]?.url && (
                <div className="w-10 h-10 relative rounded overflow-hidden shrink-0">
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-gray-900 truncate">{listing.title}</p>
                <p className="text-sm font-bold text-gray-900">${(listing.price_cents / 100).toFixed(2)}</p>
              </div>
              {listing.status === 'SOLD' ? (
                <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">Sold</span>
              ) : (
                <span className="px-3 py-1.5 bg-primary text-white rounded-full text-xs font-semibold">
                  Buy
                </span>
              )}
            </div>
          </Link>
        )}

        {ctaLink && short.target_type === 'EXTERNAL' && (
          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleCTAClick}
            className="absolute bottom-20 left-3 right-3 z-10"
          >
            <div className="bg-primary text-white rounded-xl p-4 text-center font-semibold hover:bg-primary/90 transition-colors">
              Visit Link
            </div>
          </a>
        )}
      </div>
    </div>
  )
}
