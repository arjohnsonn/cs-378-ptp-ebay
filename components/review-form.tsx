'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { StarRating } from '@/components/star-rating'
import { toast } from 'sonner'
import { Trash2, ImagePlus } from 'lucide-react'
import { createReview, updateReview, deleteReview, uploadReviewImage } from '@/lib/actions/reviews'
import type { Review, ReviewImage } from '@/lib/types/database'

interface ReviewFormProps {
  orderId: string
  existing: (Review & { images?: ReviewImage[] }) | null
}

export function ReviewForm({ orderId, existing }: ReviewFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [body, setBody] = useState(existing?.body ?? '')
  const [images, setImages] = useState<ReviewImage[]>(existing?.images ?? [])
  const [uploading, setUploading] = useState(false)

  const handleSubmit = () => {
    if (rating < 1) {
      toast.error('Select a star rating')
      return
    }

    startTransition(async () => {
      const res = existing
        ? await updateReview(existing.id, rating, body)
        : await createReview(orderId, rating, body)

      if (res.error) {
        toast.error(res.error)
        return
      }

      toast.success(existing ? 'Review updated' : 'Review posted')
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!existing) return
    if (!confirm('Delete this review?')) return
    startTransition(async () => {
      const res = await deleteReview(existing.id)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Review deleted')
      router.refresh()
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!existing) {
      toast.error('Post the review first, then add photos')
      return
    }
    setUploading(true)
    for (const file of Array.from(files)) {
      const res = await uploadReviewImage(existing.id, file)
      if (res.error) {
        toast.error(res.error)
        continue
      }
      const url = res.url
      if (url) {
        setImages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}-${Math.random()}`,
            review_id: existing.id,
            url,
            position: prev.length,
            created_at: new Date().toISOString(),
          },
        ])
      }
    }
    setUploading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4 border border-border/50 rounded-xl p-5 bg-card">
      <div className="space-y-2">
        <Label>Your rating</Label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-body">Your review (optional)</Label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="How was the item? How was the seller?"
          className="w-full px-4 py-3 bg-secondary/30 border-0 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <p className="text-xs text-muted-foreground text-right">{body.length}/2000</p>
      </div>

      {existing && (
        <div className="space-y-2">
          <Label>Photos (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary"
              >
                <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
            </label>
          </div>
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={isPending || rating < 1} className="rounded-xl">
          {isPending ? 'Saving…' : existing ? 'Update review' : 'Post review'}
        </Button>
        {existing && (
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
