'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoUpload } from '@/components/video-upload'
import { createShort } from '@/lib/actions/shorts'
import type { Listing } from '@/lib/types/database'

export default function NewShortPage() {
  const router = useRouter()
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [targetType, setTargetType] = useState<'LISTING' | 'EXTERNAL'>('LISTING')
  const [targetListingId, setTargetListingId] = useState('')
  const [targetExternalUrl, setTargetExternalUrl] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
      if (data) setListings(data)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!videoUrl) {
      setError('Please upload a video')
      return
    }

    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('videoUrl', videoUrl)
    formData.set('caption', caption)
    formData.set('targetType', targetType)
    if (targetType === 'LISTING') {
      formData.set('targetListingId', targetListingId)
    } else {
      formData.set('targetExternalUrl', targetExternalUrl)
    }

    const result = await createShort(formData)
    setPending(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Short</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Video</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoUpload onUpload={setVideoUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                placeholder="Add a caption..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Type</Label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as 'LISTING' | 'EXTERNAL')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="LISTING">Link to Listing</option>
                <option value="EXTERNAL">External URL</option>
              </select>
            </div>

            {targetType === 'LISTING' && (
              <div className="space-y-2">
                <Label>Select Listing</Label>
                {listings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active listings. Create an active listing first.
                  </p>
                ) : (
                  <select
                    value={targetListingId}
                    onChange={(e) => setTargetListingId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a listing...</option>
                    {listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title} - ${(listing.price_cents / 100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {targetType === 'EXTERNAL' && (
              <div className="space-y-2">
                <Label htmlFor="externalUrl">External URL</Label>
                <Input
                  id="externalUrl"
                  type="url"
                  value={targetExternalUrl}
                  onChange={(e) => setTargetExternalUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be a secure HTTPS URL
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={pending || !videoUrl}>
            {pending ? 'Creating...' : 'Create Short'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/sell/shorts')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
