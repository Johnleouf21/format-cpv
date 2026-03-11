'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileUpload } from './FileUpload'
import { EmailPreviewList } from './EmailPreviewList'
import { Loader2, Send, CheckCircle, XCircle, Upload } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface BulkInvitePageClientProps {
  parcoursList: Parcours[]
}

interface BulkResult {
  success: boolean
  created: number
  emailsSent: number
  failedEmails: string[]
}

export function BulkInvitePageClient({ parcoursList }: BulkInvitePageClientProps) {
  const [parcoursId, setParcoursId] = useState<string>('')
  const [emails, setEmails] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)

  const handleEmailsLoaded = (loadedEmails: string[]) => {
    setEmails(loadedEmails)
    setError(null)
    setResult(null)
  }

  const handleRemoveEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleClearEmails = () => {
    setEmails([])
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!parcoursId) {
      setError('Veuillez sélectionner un parcours')
      return
    }

    if (emails.length === 0) {
      setError('Veuillez importer des emails')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcoursId,
          emails,
          sendEmails: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de l\'envoi')
      }

      const data = await response.json()
      setResult(data)
      setEmails([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Parcours selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50">
              <Upload className="h-4.5 w-4.5 text-violet-600" />
            </div>
            Configuration
          </CardTitle>
          <CardDescription>
            Sélectionnez le parcours et importez votre fichier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <FileUpload
            onEmailsLoaded={handleEmailsLoaded}
            onError={setError}
          />
        </CardContent>
      </Card>

      {/* Email preview */}
      <EmailPreviewList
        emails={emails}
        onRemove={handleRemoveEmail}
        onClear={handleClearEmails}
      />

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className={result.failedEmails.length > 0 ? 'border-yellow-500' : 'border-green-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failedEmails.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-600" />
              )}
              Résultat de l&apos;envoi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>{result.created}</strong> invitation{result.created > 1 ? 's' : ''} créée{result.created > 1 ? 's' : ''}
            </p>
            <p>
              <strong>{result.emailsSent}</strong> email{result.emailsSent > 1 ? 's' : ''} envoyé{result.emailsSent > 1 ? 's' : ''}
            </p>
            {result.failedEmails.length > 0 && (
              <div className="mt-4">
                <p className="text-yellow-700 font-medium">
                  Emails échoués ({result.failedEmails.length}):
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {result.failedEmails.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit button */}
      {emails.length > 0 && !result && (
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !parcoursId}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Envoyer {emails.length} invitation{emails.length > 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
