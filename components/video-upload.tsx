'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { uploadVideo } from '@/lib/actions/shorts'

interface VideoUploadProps {
  onUpload: (url: string) => void
}

export function VideoUpload({ onUpload }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 200 * 1024 * 1024) {
      alert('Video must be under 200MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    setUploading(true)
    const result = await uploadVideo(file)
    setUploading(false)

    if (result.error) {
      alert(result.error)
      setPreview(null)
      return
    }

    if (result.url) {
      onUpload(result.url)
    }
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative aspect-[9/16] max-w-sm bg-black rounded-lg overflow-hidden">
          <video
            src={preview}
            className="w-full h-full object-contain"
            controls
            muted
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white">Uploading...</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="aspect-[9/16] max-w-sm border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
        >
          <p className="text-muted-foreground">Click to upload video</p>
          <p className="text-sm text-muted-foreground">Max 200MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        className="hidden"
      />

      {preview && !uploading && (
        <Button
          variant="outline"
          onClick={() => {
            setPreview(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
        >
          Change Video
        </Button>
      )}
    </div>
  )
}
