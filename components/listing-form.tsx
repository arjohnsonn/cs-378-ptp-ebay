'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createListing, updateListing, deleteListing, uploadListingImage, deleteListingImage } from '@/lib/actions/listings'
import { categories, conditions } from '@/lib/constants/categories'
import type { ListingWithImages } from '@/lib/types/database'

interface ListingFormProps {
  listing?: ListingWithImages
}

export function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [localImages, setLocalImages] = useState<{ id: string; url: string; file?: File }[]>(
    listing?.images?.map(img => ({ id: img.id, url: img.url })) || []
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!listing

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    )
    handleFiles(files)
  }, [])

  const handleFiles = (files: File[]) => {
    const newImages = files.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file
    }))
    setLocalImages(prev => [...prev, ...newImages])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = async (imageId: string) => {
    const image = localImages.find(img => img.id === imageId)
    if (!image) return

    if (image.file) {
      URL.revokeObjectURL(image.url)
      setLocalImages(prev => prev.filter(img => img.id !== imageId))
    } else if (listing) {
      await deleteListingImage(imageId, listing.id)
      setLocalImages(prev => prev.filter(img => img.id !== imageId))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (isEdit) {
        const result = await updateListing(listing.id, formData)
        if (result?.error) {
          setError(result.error)
          setPending(false)
          return
        }

        const newImages = localImages.filter(img => img.file)
        for (const img of newImages) {
          if (img.file) {
            await uploadListingImage(listing.id, img.file)
          }
        }

        router.push('/sell/listings')
        router.refresh()
      } else {
        const result = await createListing(formData)
        if (result?.error) {
          setError(result.error)
          setPending(false)
          return
        }

        if (result?.id) {
          const newImages = localImages.filter(img => img.file)
          for (const img of newImages) {
            if (img.file) {
              await uploadListingImage(result.id, img.file)
            }
          }
          router.push(`/sell/listings/${result.id}/edit`)
          router.refresh()
        }
      }
    } catch {
      setError('Something went wrong')
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!listing || !confirm('Delete this listing?')) return
    setPending(true)
    await deleteListing(listing.id)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 animate-in">
          {error}
        </div>
      )}

      {/* Image Upload Section */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Photos</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add up to 10 photos. Drag to reorder.
          </p>
        </div>

        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200
            ${dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
            id="image-upload"
          />

          {localImages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-foreground font-medium mb-1">Drag and drop images here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full"
              >
                Choose Files
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {localImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative aspect-square group rounded-xl overflow-hidden bg-secondary/50"
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                        Cover
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                {localImages.length < 10 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/30 flex items-center justify-center transition-all duration-200"
                  >
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Listing Details */}
      <div className="space-y-6 bg-card border border-border/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold">Listing Details</h3>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={listing?.title}
            required
            maxLength={200}
            placeholder="What are you selling?"
            className="h-12 px-4 bg-secondary/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={listing?.description || ''}
            rows={4}
            maxLength={5000}
            placeholder="Describe your item in detail..."
            className="w-full px-4 py-3 bg-secondary/30 border-0 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue={listing?.category || 'other'}
              className="w-full h-12 px-4 bg-secondary/30 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <select
              id="condition"
              name="condition"
              defaultValue={listing?.condition || 'good'}
              className="w-full h-12 px-4 bg-secondary/30 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              {conditions.map(cond => (
                <option key={cond.slug} value={cond.slug}>{cond.name} - {cond.description}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={listing ? (listing.price_cents / 100).toFixed(2) : ''}
                required
                placeholder="0.00"
                className="h-12 pl-8 pr-4 bg-secondary/30 border-0 rounded-xl focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={listing?.status || 'DRAFT'}
              className="w-full h-12 px-4 bg-secondary/30 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            >
              <option value="DRAFT">Draft (not visible)</option>
              <option value="ACTIVE">Active (visible to buyers)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-full px-8 h-12"
        >
          {pending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Listing'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/sell/listings')}
          className="rounded-full px-8 h-12"
        >
          Cancel
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-full px-8 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          >
            Delete Listing
          </Button>
        )}
      </div>
    </form>
  )
}
