'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Image as ImageIcon, Loader2, Check, X } from 'lucide-react'

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void
}

export function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadedUrl(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'modules')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de l\'upload')
      }

      const result = await response.json()
      setUploadedUrl(result.url)
      onImageUploaded(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsUploading(false)
    }
  }, [onImageUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  })

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Ajouter une image</p>
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload en cours...</p>
            </>
          ) : uploadedUrl ? (
            <>
              <Check className="h-8 w-8 text-green-500" />
              <p className="text-sm text-green-600">Image uploadée avec succès</p>
              <p className="text-xs text-muted-foreground break-all">{uploadedUrl}</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Déposez l\'image ici'
                  : 'Glissez une image ou cliquez pour sélectionner'}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF ou WebP - Max 5 Mo
              </p>
            </>
          )}
        </div>
      </Card>
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
