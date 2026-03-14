'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, UserPlus, Users, CheckCircle, AlertCircle } from 'lucide-react'

interface UserResult {
  id: string
  email: string
  name: string
  role: string
}

interface AddTrainerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { email: string; name?: string }) => Promise<void>
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  TRAINER: 'Formateur',
  LEARNER: 'Apprenant',
}

export function AddTrainerForm({ open, onOpenChange, onSubmit }: AddTrainerFormProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  // New user mode
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  // Existing user mode
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  // Shared
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const resetForm = useCallback(() => {
    setEmail('')
    setName('')
    setSearch('')
    setSearchResults([])
    setSelectedUser(null)
    setError(null)
    setSuccess(null)
    setMode('existing')
  }, [])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(search)}`)
        if (res.ok) {
          const data = await res.json()
          // Filter out admins and existing trainers
          setSearchResults(
            data.filter((u: UserResult) => u.role === 'LEARNER')
          )
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  async function handleSubmitNew(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({ email, name: name || undefined })
      setSuccess(`${email} a été ajouté comme formateur.`)
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePromoteUser() {
    if (!selectedUser) return
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({ email: selectedUser.email })
      setSuccess(`${selectedUser.name} a été promu formateur.`)
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un formateur</DialogTitle>
          <DialogDescription>
            Promouvoir un utilisateur existant ou ajouter un nouvel email
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'existing' | 'new'); setError(null); setSuccess(null) }}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1 gap-2">
              <Users className="h-4 w-4" />
              Utilisateur existant
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1 gap-2">
              <UserPlus className="h-4 w-4" />
              Nouvel email
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {mode === 'existing' && !success && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rechercher un utilisateur</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedUser(null) }}
                  className="pl-8"
                />
              </div>
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && search.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun apprenant trouvé. Essayez l&apos;onglet &quot;Nouvel email&quot;.
              </p>
            )}

            {searchResults.length > 0 && !selectedUser && (
              <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="border rounded-md p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <Badge variant="secondary">{roleLabels[selectedUser.role]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Cet utilisateur sera promu au rôle de formateur.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePromoteUser}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Promouvoir
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'new' && !success && (
          <form onSubmit={handleSubmitNew}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trainer-email">Email *</Label>
                <Input
                  id="trainer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="formateur@exemple.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainer-name">Nom (optionnel)</Label>
                <Input
                  id="trainer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                />
                <p className="text-xs text-muted-foreground">
                  Si l&apos;utilisateur existe déjà, son nom actuel sera conservé
                </p>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !email}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'existing' && !success && !selectedUser && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
