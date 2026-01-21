'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { categories, conditions, priceRanges, type CategorySlug, type ConditionSlug } from '@/lib/constants/categories'
import { X } from 'lucide-react'

interface FiltersProps {
  showCategories?: boolean
  currentCategory?: CategorySlug
}

export function Filters({ showCategories = true, currentCategory }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const selectedConditions = searchParams.get('conditions')?.split(',').filter(Boolean) || []
  const selectedPriceRange = searchParams.get('price') || ''

  const updateFilters = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const toggleArrayFilter = useCallback((key: string, value: string, current: string[]) => {
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateFilters(key, updated.length > 0 ? updated.join(',') : null)
  }, [updateFilters])

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams()
    const q = searchParams.get('q')
    if (q) params.set('q', q)
    router.push(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const hasFilters = selectedCategories.length > 0 || selectedConditions.length > 0 || selectedPriceRange

  return (
    <div className="space-y-6">
      {hasFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Active Filters</span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      {showCategories && !currentCategory && (
        <>
          <div>
            <h3 className="font-semibold mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map(category => {
                const Icon = category.icon
                const isSelected = selectedCategories.includes(category.slug)
                return (
                  <div key={category.slug} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category.slug}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleArrayFilter('categories', category.slug, selectedCategories)}
                    />
                    <Label
                      htmlFor={`cat-${category.slug}`}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                      {category.name}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <h3 className="font-semibold mb-3">Condition</h3>
        <div className="space-y-2">
          {conditions.map(condition => {
            const isSelected = selectedConditions.includes(condition.slug)
            return (
              <div key={condition.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={`cond-${condition.slug}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleArrayFilter('conditions', condition.slug, selectedConditions)}
                />
                <Label htmlFor={`cond-${condition.slug}`} className="text-sm cursor-pointer">
                  {condition.name}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="space-y-2">
          {priceRanges.map((range, index) => {
            const value = `${range.min}-${range.max ?? ''}`
            const isSelected = selectedPriceRange === value
            return (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`price-${index}`}
                  checked={isSelected}
                  onCheckedChange={() => updateFilters('price', isSelected ? null : value)}
                />
                <Label htmlFor={`price-${index}`} className="text-sm cursor-pointer">
                  {range.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function FilterTags() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const selectedConditions = searchParams.get('conditions')?.split(',').filter(Boolean) || []
  const selectedPriceRange = searchParams.get('price') || ''

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      const current = params.get(key)?.split(',').filter(Boolean) || []
      const updated = current.filter(v => v !== value)
      if (updated.length > 0) {
        params.set(key, updated.join(','))
      } else {
        params.delete(key)
      }
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const tags: { label: string; onRemove: () => void }[] = []

  selectedCategories.forEach(slug => {
    const cat = categories.find(c => c.slug === slug)
    if (cat) {
      tags.push({ label: cat.name, onRemove: () => removeFilter('categories', slug) })
    }
  })

  selectedConditions.forEach(slug => {
    const cond = conditions.find(c => c.slug === slug)
    if (cond) {
      tags.push({ label: cond.name, onRemove: () => removeFilter('conditions', slug) })
    }
  })

  if (selectedPriceRange) {
    const [min, max] = selectedPriceRange.split('-')
    const range = priceRanges.find(r => r.min === Number(min) && (r.max === null ? max === '' : r.max === Number(max)))
    if (range) {
      tags.push({ label: range.label, onRemove: () => removeFilter('price') })
    }
  }

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map((tag, index) => (
        <Button
          key={index}
          variant="secondary"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={tag.onRemove}
        >
          {tag.label}
          <X className="w-3 h-3" />
        </Button>
      ))}
    </div>
  )
}
