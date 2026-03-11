'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface InviteFormProps {
  parcoursList: Parcours[]
  onInvitationCreated: (invitation: {
    token: string
    email?: string
    parcoursTitle: string
    expiresAt: string
  }) => void
}

export function InviteForm({ parcoursList, onInvitationCreated }: InviteFormProps) {
  const [parcoursId, setParcoursId] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parcoursId) {
      setError('Veuillez sélectionner un parcours')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcoursId,
          email: email || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la création')
      }

      const data = await response.json()
      const invitation = data.invitations[0]
      const parcours = parcoursList.find((p) => p.id === parcoursId)

      onInvitationCreated({
        token: invitation.token,
        email: invitation.email,
        parcoursTitle: parcours?.title || '',
        expiresAt: invitation.expiresAt,
      })

      // Reset form
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="parcours">Parcours *</Label>
        <Select value={parcoursId} onValueChange={setParcoursId}>
          <SelectTrigger id="parcours">
            <SelectValue placeholder="Sélectionner un parcours" />
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
        <Label htmlFor="email">Email (optionnel)</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Si spécifié, le lien sera réservé à cette adresse email
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" disabled={isLoading || !parcoursId}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération...
          </>
        ) : (
          'Générer le lien'
        )}
      </Button>
    </form>
  )
}
