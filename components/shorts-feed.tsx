'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ShortPlayer } from './short-player'
import type { ShortWithListing } from '@/lib/types/database'

interface ShortsFeedProps {
  shorts: ShortWithListing[]
}

export function ShortsFeed({ shorts }: ShortsFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return
    const target = container.children[index] as HTMLElement
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1)
    }
  }, [activeIndex, scrollToIndex])

  const goToNext = useCallback(() => {
    if (activeIndex < shorts.length - 1) {
      scrollToIndex(activeIndex + 1)
    }
  }, [activeIndex, shorts.length, scrollToIndex])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'))
            setActiveIndex(index)
          }
        })
      },
      {
        root: container,
        threshold: 0.6,
      }
    )

    Array.from(container.children).forEach((child) => {
      observer.observe(child)
    })

    return () => observer.disconnect()
  }, [shorts])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext])

  if (shorts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-white/60">
        <p>No shorts yet. Be the first to create one!</p>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center relative">
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {shorts.map((short, index) => (
          <div
            key={short.id}
            data-index={index}
            className="h-full snap-start snap-always flex items-center justify-center py-4"
          >
            <ShortPlayer short={short} isActive={index === activeIndex} />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Desktop only */}
      <div className="hidden lg:flex flex-col gap-3 fixed right-8 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={goToPrevious}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          disabled={activeIndex === shorts.length - 1}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
