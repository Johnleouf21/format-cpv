'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, UserPlus, CheckCircle, Info } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface AddUserDialogProps {
  parcoursList: Parcours[]
  onUserAdded: () => void
  trigger?: React.ReactNode
}

export function AddUserDialog({ parcoursList, onUserAdded, trigger }: AddUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedParcours, setSelectedParcours] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ isNew: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleParcours = (parcoursId: string) => {
    setSelectedParcours((prev) =>
      prev.includes(parcoursId) ? prev.filter((id) => id !== parcoursId) : [...prev, parcoursId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          parcoursIds: selectedParcours,
          sendEmail: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'ajout')
      }

      if (data.isNew) {
        setResult({ isNew: true, message: `${email} a été invité et recevra un email.` })
      } else {
        const count = data.assignedParcours?.length || 0
        setResult({
          isNew: false,
          message: count > 0
            ? `${email} existe déjà. ${count} parcours ajouté(s).`
            : `${email} existe déjà et a déjà ces parcours.`,
        })
      }

      onUserAdded()
      // Reset form after short delay
      setTimeout(() => {
        setEmail('')
        setName('')
        setSelectedParcours([])
        setResult(null)
        setOpen(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un apprenant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un apprenant</DialogTitle>
          <DialogDescription>
            L&apos;apprenant recevra un email d&apos;invitation pour se connecter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-email">Email *</Label>
            <Input
              id="add-email"
              type="email"
              placeholder="apprenant@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-name">Nom (optionnel)</Label>
            <Input
              id="add-name"
              placeholder="Jean Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {parcoursList.length > 0 && (
            <div className="space-y-2">
              <Label>Parcours à assigner</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {parcoursList.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedParcours.includes(p.id)}
                      onCheckedChange={() => toggleParcours(p.id)}
                    />
                    <span className="text-sm">{p.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {result && (
            <div className={`text-sm p-2 rounded flex items-start gap-2 ${result.isNew ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
              {result.isNew ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <Info className="h-4 w-4 mt-0.5 shrink-0" />}
              {result.message}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !email}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
