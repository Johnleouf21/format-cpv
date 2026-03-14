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
import { ImageUploader } from './ImageUploader'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ExternalLink, Eye, Code, AlertCircle } from 'lucide-react'
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

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef<number>(0)
  const [showPreview, setShowPreview] = useState(false)

  const isEditing = !!module

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

  function handleImageUploaded(url: string) {
    const imageMarkdown = `\n![Image](${url})\n`
    const position = cursorPositionRef.current

    setContent((prev) => {
      const before = prev.substring(0, position)
      const after = prev.substring(position)
      return before + imageMarkdown + after
    })

    // Update cursor position for next insert
    cursorPositionRef.current = position + imageMarkdown.length
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

          <div className="grid grid-cols-2 gap-4">
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

              <ImageUploader onImageUploaded={handleImageUploaded} />
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
