export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'ARCHIVED'
export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type ShortTargetType = 'LISTING' | 'EXTERNAL'
export type EventType = 'SHORT_VIEW' | 'SHORT_CLICK' | 'PURCHASE_SUCCESS'
export type ListingCategory = 'electronics' | 'fashion' | 'home' | 'sports' | 'collectibles' | 'art' | 'books' | 'music' | 'toys' | 'other'
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'COUNTERED' | 'EXPIRED' | 'ACCEPTED_PAID'
export type OfferRole = 'BUYER' | 'SELLER'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  price_cents: number
  status: ListingStatus
  category: ListingCategory
  condition: ListingCondition
  accepts_offers: boolean
  min_offer_cents: number | null
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount_cents: number
  from_role: OfferRole
  status: OfferStatus
  parent_offer_id: string | null
  message: string | null
  expires_at: string
  stripe_checkout_session_id: string | null
  order_id: string | null
  created_at: string
  updated_at: string
}

export interface OfferWithListing extends Offer {
  listing?: Listing & { images?: ListingImage[] }
  buyer?: Profile
  seller?: Profile
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  position: number
  created_at: string
}

export interface Short {
  id: string
  creator_id: string
  video_url: string
  poster_url: string | null
  caption: string | null
  target_type: ShortTargetType
  target_listing_id: string | null
  target_external_url: string | null
  view_count: number
  click_count: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  buyer_id: string
  listing_id: string
  seller_id: string
  amount_cents: number
  status: OrderStatus
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  event_type: EventType
  user_id: string | null
  short_id: string | null
  listing_id: string | null
  order_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ListingWithImages extends Listing {
  images: ListingImage[]
  seller?: Profile
}

export interface ShortWithListing extends Short {
  listing?: ListingWithImages | null
  creator?: Profile
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      listings: {
        Row: Listing
        Insert: Omit<Listing, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Listing, 'id' | 'seller_id' | 'created_at'>>
      }
      listing_images: {
        Row: ListingImage
        Insert: Omit<ListingImage, 'id' | 'created_at'>
        Update: Partial<Omit<ListingImage, 'id' | 'created_at'>>
      }
      shorts: {
        Row: Short
        Insert: Omit<Short, 'id' | 'view_count' | 'click_count' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Short, 'id' | 'creator_id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'buyer_id' | 'listing_id' | 'seller_id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: never
      }
      offers: {
        Row: Offer
        Insert: Omit<Offer, 'id' | 'status' | 'created_at' | 'updated_at'> & { status?: OfferStatus }
        Update: Partial<Omit<Offer, 'id' | 'listing_id' | 'buyer_id' | 'seller_id' | 'created_at'>>
      }
    }
    Enums: {
      listing_status: ListingStatus
      order_status: OrderStatus
      short_target_type: ShortTargetType
      event_type: EventType
      offer_status: OfferStatus
      offer_role: OfferRole
    }
  }
}
