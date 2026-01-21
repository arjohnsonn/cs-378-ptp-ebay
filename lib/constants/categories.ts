import {
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  Star,
  Palette,
  BookOpen,
  Music,
  Gamepad2,
  MoreHorizontal,
  type LucideIcon
} from 'lucide-react'

export type CategorySlug =
  | 'electronics'
  | 'fashion'
  | 'home'
  | 'sports'
  | 'collectibles'
  | 'art'
  | 'books'
  | 'music'
  | 'toys'
  | 'other'

export type ConditionSlug = 'new' | 'like_new' | 'good' | 'fair' | 'poor'

export interface Category {
  slug: CategorySlug
  name: string
  description: string
  icon: LucideIcon
  color: string
}

export interface Condition {
  slug: ConditionSlug
  name: string
  description: string
}

export const categories: Category[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Phones, computers, cameras & more',
    icon: Smartphone,
    color: ''
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    description: 'Clothing, shoes, watches & accessories',
    icon: Shirt,
    color: ''
  },
  {
    slug: 'home',
    name: 'Home & Garden',
    description: 'Furniture, decor, plants & kitchen',
    icon: Home,
    color: ''
  },
  {
    slug: 'sports',
    name: 'Sports',
    description: 'Equipment, apparel & outdoor gear',
    icon: Dumbbell,
    color: ''
  },
  {
    slug: 'collectibles',
    name: 'Collectibles',
    description: 'Vintage items, memorabilia & antiques',
    icon: Star,
    color: ''
  },
  {
    slug: 'art',
    name: 'Art & Crafts',
    description: 'Paintings, supplies & handmade items',
    icon: Palette,
    color: ''
  },
  {
    slug: 'books',
    name: 'Books',
    description: 'Fiction, non-fiction & textbooks',
    icon: BookOpen,
    color: ''
  },
  {
    slug: 'music',
    name: 'Music',
    description: 'Instruments, vinyl & audio equipment',
    icon: Music,
    color: ''
  },
  {
    slug: 'toys',
    name: 'Toys & Games',
    description: 'Board games, video games & toys',
    icon: Gamepad2,
    color: ''
  },
  {
    slug: 'other',
    name: 'Other',
    description: 'Everything else',
    icon: MoreHorizontal,
    color: ''
  }
]

export const conditions: Condition[] = [
  { slug: 'new', name: 'New', description: 'Brand new, never used' },
  { slug: 'like_new', name: 'Like New', description: 'Barely used, excellent condition' },
  { slug: 'good', name: 'Good', description: 'Normal wear, fully functional' },
  { slug: 'fair', name: 'Fair', description: 'Some wear, works well' },
  { slug: 'poor', name: 'Poor', description: 'Heavy wear, may need repair' }
]

export const priceRanges = [
  { label: 'Under $25', min: 0, max: 2500 },
  { label: '$25 - $50', min: 2500, max: 5000 },
  { label: '$50 - $100', min: 5000, max: 10000 },
  { label: '$100 - $250', min: 10000, max: 25000 },
  { label: '$250+', min: 25000, max: null }
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug)
}

export function getConditionBySlug(slug: string): Condition | undefined {
  return conditions.find(c => c.slug === slug)
}
