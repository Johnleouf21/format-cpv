'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Check, Copy, Link as LinkIcon } from 'lucide-react'

interface LinkDisplayProps {
  token: string
  email?: string
  parcoursTitle: string
  expiresAt: string
}

export function LinkDisplay({
  token,
  email,
  parcoursTitle,
  expiresAt,
}: LinkDisplayProps) {
  const [copied, setCopied] = useState(false)

  const inviteLink = `${window.location.origin}/invite/${token}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateString))
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-green-700">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100">
            <LinkIcon className="h-4.5 w-4.5 text-green-600" />
          </div>
          Lien d&apos;invitation généré
        </CardTitle>
        <CardDescription>
          Partagez ce lien avec votre apprenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            readOnly
            value={inviteLink}
            className="bg-white font-mono text-sm"
          />
          <Button
            onClick={handleCopy}
            variant={copied ? 'default' : 'outline'}
            className={copied ? 'bg-green-600' : ''}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copié
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Parcours:</strong> {parcoursTitle}
          </p>
          {email && (
            <p>
              <strong>Réservé à:</strong> {email}
            </p>
          )}
          <p>
            <strong>Expire le:</strong> {formatDate(expiresAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
