'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { uploadListingImage, deleteListingImage } from '@/lib/actions/listings'
import type { ListingImage } from '@/lib/types/database'

interface ImageUploadProps {
  listingId: string
  images: ListingImage[]
}

export function ImageUpload({ listingId, images }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    await uploadListingImage(listingId, file)
    setUploading(false)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  async function handleDelete(imageId: string) {
    setDeletingId(imageId)
    await deleteListingImage(imageId, listingId)
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="relative aspect-square group">
            <Image
              src={image.url}
              alt=""
              fill
              className="object-cover rounded-md"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(image.id)}
              disabled={deletingId === image.id}
            >
              {deletingId === image.id ? '...' : '×'}
            </Button>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading...' : 'Add Image'}
        </Button>
      </div>
    </div>
  )
}
