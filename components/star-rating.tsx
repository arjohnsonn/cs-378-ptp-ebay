'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  readOnly = false,
  className,
}: StarRatingProps) {
  const Stars = [1, 2, 3, 4, 5]
  const interactive = !readOnly && !!onChange

  return (
    <div className={cn('flex items-center gap-0.5', className)} role="radiogroup">
      {Stars.map((n) => {
        const filled = n <= value
        const partial = !filled && n - value < 1 && n - value > 0
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={cn(
              'transition-transform',
              interactive && 'hover:scale-110 cursor-pointer',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled || partial ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-muted-foreground'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
