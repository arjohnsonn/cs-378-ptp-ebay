'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoUpload } from '@/components/video-upload'
import { createShort, setShortListings } from '@/lib/actions/shorts'
import { Trash2, Plus } from 'lucide-react'
import type { Listing } from '@/lib/types/database'

interface PinDraft {
  id: string
  listingId: string
  startSeconds: string
  endSeconds: string
  label: string
}

function emptyPin(): PinDraft {
  return {
    id: `${Date.now()}-${Math.random()}`,
    listingId: '',
    startSeconds: '',
    endSeconds: '',
    label: '',
  }
}

export default function NewShortPage() {
  const router = useRouter()
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [targetType, setTargetType] = useState<'LISTING' | 'EXTERNAL'>('LISTING')
  const [targetListingId, setTargetListingId] = useState('')
  const [targetExternalUrl, setTargetExternalUrl] = useState('')
  const [pins, setPins] = useState<PinDraft[]>([])
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

  const updatePin = (id: string, patch: Partial<PinDraft>) => {
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const removePin = (id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id))
  }

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

    if (result?.error || !result?.id) {
      setError(result?.error || 'Failed to create short')
      setPending(false)
      return
    }

    const validPins = pins.filter((p) => p.listingId)
    if (validPins.length > 0) {
      const parsed = validPins.map((p) => ({
        listingId: p.listingId,
        startSeconds: p.startSeconds ? parseFloat(p.startSeconds) : null,
        endSeconds: p.endSeconds ? parseFloat(p.endSeconds) : null,
        label: p.label || null,
      }))

      const pinResult = await setShortListings(result.id, parsed)
      if (pinResult.error) {
        setError(`Short created, but pins failed: ${pinResult.error}`)
        setPending(false)
        return
      }
    }

    router.push('/sell/shorts')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Short</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
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
                <Label>Primary Listing</Label>
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
                <p className="text-xs text-muted-foreground">Must be a secure HTTPS URL</p>
              </div>
            )}
          </CardContent>
        </Card>

        {targetType === 'LISTING' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shoppable Pins</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pin additional listings to timestamps. Viewers see the matching product card as
                    the video plays.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPins((prev) => [...prev, emptyPin()])}
                  disabled={listings.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add pin
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pins.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pins yet. Primary listing shows by default.
                </p>
              ) : (
                pins.map((pin, idx) => (
                  <div
                    key={pin.id}
                    className="border border-border/50 rounded-lg p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Pin {idx + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePin(pin.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Listing</Label>
                      <select
                        value={pin.listingId}
                        onChange={(e) => updatePin(pin.id, { listingId: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select listing...</option>
                        {listings.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title} - ${(l.price_cents / 100).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Start (s)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={pin.startSeconds}
                          onChange={(e) => updatePin(pin.id, { startSeconds: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End (s)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={pin.endSeconds}
                          onChange={(e) => updatePin(pin.id, { endSeconds: e.target.value })}
                          placeholder="∞"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Label (optional)</Label>
                      <Input
                        value={pin.label}
                        onChange={(e) => updatePin(pin.id, { label: e.target.value })}
                        maxLength={60}
                        placeholder="e.g. Featured, In stock now"
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={pending || !videoUrl}>
            {pending ? 'Creating...' : 'Create Short'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/sell/shorts')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
