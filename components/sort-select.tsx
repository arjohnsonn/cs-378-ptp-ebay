'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SortSelectProps {
  defaultValue: string
}

export function SortSelect({ defaultValue }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <select
      defaultValue={defaultValue}
      onChange={handleChange}
      className="h-9 px-3 text-sm border rounded-lg bg-background"
    >
      <option value="newest">Newest First</option>
      <option value="price_low">Price: Low to High</option>
      <option value="price_high">Price: High to Low</option>
    </select>
  )
}
