'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'

interface ImageCarouselProps {
  images: { id: string; url: string }[]
  title: string
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on('select', onSelect)
    onSelect()

    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index)
  }, [api])

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-secondary/30 rounded-2xl flex items-center justify-center text-muted-foreground">
        No images
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={img.id}>
              <div className="aspect-square relative bg-secondary/30 rounded-2xl overflow-hidden">
                <Image
                  src={img.url}
                  alt={index === 0 ? title : ''}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-3 bg-background/80 backdrop-blur-sm border-0 hover:bg-background" />
            <CarouselNext className="right-3 bg-background/80 backdrop-blur-sm border-0 hover:bg-background" />
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => scrollTo(index)}
              className={`
                relative shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200
                ${index === current
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'opacity-50 hover:opacity-100'
                }
              `}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
