import Link from 'next/link'
import { ListingForm } from '@/components/listing-form'

export default function NewListingPage() {
  return (
    <div className="max-w-3xl animate-in">
      <div className="mb-8">
        <Link
          href="/sell/listings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Listing</h1>
        <p className="text-muted-foreground mt-2">
          Add photos and details about your product
        </p>
      </div>
      <ListingForm />
    </div>
  )
}
