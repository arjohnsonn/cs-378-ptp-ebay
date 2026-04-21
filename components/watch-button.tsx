'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { addToWatchlist, removeFromWatchlist } from '@/lib/actions/watchlist'

interface WatchButtonProps {
  listingId: string
  initialWatched: boolean
  isAuthenticated: boolean
  variant?: 'icon' | 'full'
  className?: string
}

export function WatchButton({
  listingId,
  initialWatched,
  isAuthenticated,
  variant = 'icon',
  className,
}: WatchButtonProps) {
  const router = useRouter()
  const [watched, setWatched] = useState(initialWatched)
  const [isPending, startTransition] = useTransition()

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const next = !watched
    setWatched(next)

    startTransition(async () => {
      const result = next
        ? await addToWatchlist(listingId)
        : await removeFromWatchlist(listingId)

      if (result.error) {
        setWatched(!next)
        toast.error(result.error)
      }
    })
  }

  if (variant === 'full') {
    return (
      <Button
        type="button"
        variant={watched ? 'default' : 'outline'}
        size="lg"
        onClick={toggle}
        disabled={isPending}
        className={cn('w-full h-14 text-base rounded-xl gap-2', className)}
      >
        <Heart className={cn('w-5 h-5', watched && 'fill-current')} />
        {watched ? 'Saved to Watchlist' : 'Add to Watchlist'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-pressed={watched}
      className={cn(
        'absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm shadow-md',
        'hover:bg-background transition-colors',
        'disabled:opacity-60',
        className,
      )}
    >
      <Heart
        className={cn(
          'w-[18px] h-[18px] transition-colors',
          watched ? 'fill-red-500 text-red-500' : 'text-foreground',
        )}
      />
    </button>
  )
}
