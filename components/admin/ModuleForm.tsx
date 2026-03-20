'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Eye, Code, AlertCircle, ImageIcon, Video, Clock, Globe } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { ModuleContent } from '@/components/learner/ModuleContent'

interface Parcours {
  id: string
  title: string
}

interface ModuleFormProps {
  module?: {
    id: string
    title: string
    content: string
    parcoursId: string
    order: number
    minDuration?: number
    published?: boolean
  }
  parcoursList: Parcours[]
}

export function ModuleForm({ module, parcoursList }: ModuleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(module?.title || '')
  const [content, setContent] = useState(module?.content || '')
  const [parcoursId, setParcoursId] = useState(module?.parcoursId || '')
  const [order, setOrder] = useState(module?.order?.toString() || '0')
  const [minDuration, setMinDuration] = useState(module?.minDuration?.toString() || '0')
  const [published, setPublished] = useState(module?.published ?? false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<number>(0)
  const [showPreview, setShowPreview] = useState(false)

  // Media toolbar state
  const [showImageUrlForm, setShowImageUrlForm] = useState(false)
  const [showVideoUrlForm, setShowVideoUrlForm] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaAlt, setMediaAlt] = useState('')

  const isEditing = !!module

  function insertAtCursor(text: string) {
    const position = cursorPositionRef.current
    setContent((prev) => {
      const before = prev.substring(0, position)
      const after = prev.substring(position)
      return before + text + after
    })
    cursorPositionRef.current = position + text.length
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const url = isEditing ? `/api/admin/modules/${module.id}` : '/api/admin/modules'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          parcoursId,
          order: parseInt(order, 10),
          minDuration: parseInt(minDuration, 10) || 0,
          published,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Une erreur est survenue')
      }

      router.push('/admin/modules')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCursorChange() {
    if (textareaRef.current) {
      cursorPositionRef.current = textareaRef.current.selectionStart
    }
  }

  function handleInsertImageUrl() {
    if (!mediaUrl.trim()) return
    insertAtCursor(`\n![${mediaAlt || 'Image'}](${mediaUrl.trim()})\n`)
    setMediaUrl('')
    setMediaAlt('')
    setShowImageUrlForm(false)
  }

  function handleInsertVideoUrl() {
    if (!mediaUrl.trim()) return
    insertAtCursor(`\n<video-embed src="${mediaUrl.trim()}" title="${mediaAlt || ''}" />\n`)
    setMediaUrl('')
    setMediaAlt('')
    setShowVideoUrlForm(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations du module</CardTitle>
          <CardDescription>
            Définissez le titre et le parcours associé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Introduction à la formation"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parcours">Parcours *</Label>
              <Select value={parcoursId} onValueChange={setParcoursId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un parcours" />
                </SelectTrigger>
                <SelectContent>
                  {parcoursList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Ordre</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minDuration" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Temps minimum (min)
              </Label>
              <Input
                id="minDuration"
                type="number"
                min="0"
                max="480"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                0 = pas de minimum
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="published" className="flex items-center gap-1.5 cursor-pointer">
                <Globe className="h-3.5 w-3.5" />
                Publier le module
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Les modules non publiés sont invisibles pour les apprenants
              </p>
            </div>
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Contenu du module</CardTitle>
              <CardDescription>
                Rédigez le contenu en Markdown
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-lg border p-1">
                <Button
                  type="button"
                  variant={showPreview ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Éditer
                </Button>
                <Button
                  type="button"
                  variant={showPreview ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Aperçu
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href="https://stackedit.io/app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Éditeur Markdown
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showPreview ? (
            <div className="min-h-[400px] rounded-md border p-4 bg-card">
              {content ? (
                <ModuleContent content={content} />
              ) : (
                <p className="text-muted-foreground italic">Aucun contenu à afficher</p>
              )}
            </div>
          ) : (
            <>
              {/* Media toolbar */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowImageUrlForm(!showImageUrlForm); setShowVideoUrlForm(false); setMediaUrl(''); setMediaAlt('') }}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Image URL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowVideoUrlForm(!showVideoUrlForm); setShowImageUrlForm(false); setMediaUrl(''); setMediaAlt('') }}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Vidéo URL
                </Button>
              </div>

              {/* Image URL inline form */}
              {showImageUrlForm && (
                <div className="flex gap-2 items-end rounded-md border p-3 bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">URL de l&apos;image</Label>
                    <Input
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-sm"
                    />
                  </div>
                  <div className="w-48 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={mediaAlt}
                      onChange={(e) => setMediaAlt(e.target.value)}
                      placeholder="Description"
                      className="text-sm"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={handleInsertImageUrl} disabled={!mediaUrl.trim()}>
                    Insérer
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowImageUrlForm(false)}>
                    Annuler
                  </Button>
                </div>
              )}

              {/* Video URL inline form */}
              {showVideoUrlForm && (
                <div className="flex gap-2 items-end rounded-md border p-3 bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">URL de la vidéo (OneDrive, YouTube, Vimeo...)</Label>
                    <Input
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-sm"
                    />
                  </div>
                  <div className="w-48 space-y-1">
                    <Label className="text-xs">Titre (optionnel)</Label>
                    <Input
                      value={mediaAlt}
                      onChange={(e) => setMediaAlt(e.target.value)}
                      placeholder="Titre"
                      className="text-sm"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={handleInsertVideoUrl} disabled={!mediaUrl.trim()}>
                    Insérer
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowVideoUrlForm(false)}>
                    Annuler
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Contenu (Markdown) *</Label>
                <Textarea
                  id="content"
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    handleCursorChange()
                  }}
                  onSelect={handleCursorChange}
                  onClick={handleCursorChange}
                  onKeyUp={handleCursorChange}
                  placeholder="# Titre du module

Votre contenu ici...

## Section 1

Description de la section..."
                  className="min-h-[400px] font-mono text-sm"
                  required
                />
              </div>

            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting || !title || !content || !parcoursId}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Mettre à jour' : 'Créer le module'}
        </Button>
      </div>
    </form>
  )
}
