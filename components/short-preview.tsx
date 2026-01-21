'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play } from 'lucide-react'
import type { ShortWithListing } from '@/lib/types/database'

interface ShortPreviewProps {
  short: ShortWithListing
}

export function ShortPreview({ short }: ShortPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isHovered) {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isHovered])

  const listing = short.listing && !Array.isArray(short.listing) ? short.listing :
    (Array.isArray(short.listing) ? short.listing[0] : null)
  const creator = short.creator && !Array.isArray(short.creator) ? short.creator :
    (Array.isArray(short.creator) ? short.creator[0] : null)
  const creatorName = creator?.display_name || creator?.email?.split('@')[0] || 'Unknown'

  return (
    <Link
      href="/shorts"
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-[280px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]">
        <video
          ref={videoRef}
          src={short.video_url}
          poster={short.poster_url || undefined}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
        />

        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        <div className="absolute bottom-5 left-4 right-4 z-10">
          <p className="text-white font-semibold text-base mb-1">@{creatorName}</p>
          {short.caption && (
            <p className="text-white/80 text-sm line-clamp-2">{short.caption}</p>
          )}
        </div>

        {listing && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 flex gap-3 items-center shadow-xl">
              {listing.images?.[0]?.url && (
                <div className="w-12 h-12 relative rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{listing.title}</p>
                <p className="text-base font-bold text-gray-900">${(listing.price_cents / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4 group-hover:text-primary transition-colors font-light">
        Watch more shorts →
      </p>
    </Link>
  )
}
