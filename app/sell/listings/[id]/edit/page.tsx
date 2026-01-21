import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingForm } from '@/components/listing-form'
import type { ListingWithImages } from '@/lib/types/database'

interface EditListingPageProps {
  params: Promise<{ id: string }>
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      images:listing_images(*)
    `)
    .eq('id', id)
    .eq('seller_id', user!.id)
    .single()

  if (!listing) {
    notFound()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Listing</h1>
      <ListingForm listing={listing as ListingWithImages} />
    </div>
  )
}
