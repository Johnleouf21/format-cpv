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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, Users, Search, CheckCircle, Info, BookOpen, AlertCircle } from 'lucide-react'

interface Parcours {
  id: string
  title: string
}

interface UserResult {
  id: string
  email: string
  name: string
  role: string
  parcours: { id: string; title: string }[]
}

interface AddUserDialogProps {
  parcoursList: Parcours[]
  onUserAdded: () => void
  trigger?: React.ReactNode
}

export function AddUserDialog({ parcoursList, onUserAdded, trigger }: AddUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  // New user mode
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [selectedParcours, setSelectedParcours] = useState<string[]>([])
  // Existing user mode
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null)
  const [existingUserParcours, setExistingUserParcours] = useState<string[]>([])
  // Shared
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ isNew: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const resetForm = useCallback(() => {
    setEmail('')
    setName('')
    setSelectedParcours([])
    setSearch('')
    setSearchResults([])
    setSelectedUser(null)
    setExistingUserParcours([])
    setResult(null)
    setError(null)
    setMode('existing')
  }, [])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  // Search existing users with debounce
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
          setSearchResults(data)
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

  const toggleParcours = (parcoursId: string) => {
    // Don't allow unchecking already-assigned parcours for existing users
    if (selectedUser && existingUserParcours.includes(parcoursId)) return
    setSelectedParcours((prev) =>
      prev.includes(parcoursId) ? prev.filter((id) => id !== parcoursId) : [...prev, parcoursId]
    )
  }

  const selectExistingUser = (user: UserResult) => {
    setSelectedUser(user)
    const existingIds = user.parcours.map((p) => p.id)
    setExistingUserParcours(existingIds)
    setSelectedParcours(existingIds) // pre-check existing
  }

  const handleSubmitNew = async (e: React.FormEvent) => {
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
      setTimeout(() => setOpen(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitExisting = async () => {
    if (!selectedUser) return

    const newParcoursIds = selectedParcours.filter(
      (id) => !existingUserParcours.includes(id)
    )

    if (newParcoursIds.length === 0) {
      setError('Aucun nouveau parcours sélectionné.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUser.email,
          parcoursIds: newParcoursIds,
          sendEmail: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'ajout')
      }

      const count = data.assignedParcours?.length || newParcoursIds.length
      setResult({
        isNew: false,
        message: `${count} parcours ajouté(s) à ${selectedUser.name}.`,
      })

      onUserAdded()
      setTimeout(() => setOpen(false), 2000)
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un apprenant</DialogTitle>
          <DialogDescription>
            Assigner des parcours à un utilisateur existant ou inviter un nouvel apprenant
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'existing' | 'new'); setError(null); setResult(null); if (v === 'existing') setSelectedUser(null) }}>
          <TabsList className="w-full">
            <TabsTrigger value="existing" className="flex-1 gap-2">
              <Users className="h-4 w-4" />
              Existant
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

        {result && (
          <Alert className={result.isNew ? 'border-green-200 bg-green-50 text-green-700' : 'border-blue-200 bg-blue-50 text-blue-700'}>
            {result.isNew ? <CheckCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {/* Existing user mode */}
        {mode === 'existing' && !result && (
          <div className="space-y-4">
            {!selectedUser ? (
              <>
                <div className="space-y-2">
                  <Label>Rechercher un utilisateur</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
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
                    Aucun utilisateur trouvé. Essayez l&apos;onglet &quot;Nouvel email&quot;.
                  </p>
                )}

                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => selectExistingUser(user)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-2 shrink-0">
                          {user.parcours.length > 0 ? (
                            user.parcours.slice(0, 2).map((p) => (
                              <Badge key={p.id} variant="secondary" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs">Aucun parcours</Badge>
                          )}
                          {user.parcours.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{user.parcours.length - 2}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Selected user info */}
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedUser(null); setSelectedParcours([]); setExistingUserParcours([]) }}
                    >
                      Changer
                    </Button>
                  </div>
                </div>

                {/* Parcours selection */}
                {parcoursList.length > 0 && (
                  <div className="space-y-2">
                    <Label>Parcours à assigner</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {parcoursList.map((p) => {
                        const isExisting = existingUserParcours.includes(p.id)
                        return (
                          <label key={p.id} className={`flex items-center gap-2 ${isExisting ? 'opacity-60' : 'cursor-pointer'}`}>
                            <Checkbox
                              checked={selectedParcours.includes(p.id)}
                              onCheckedChange={() => toggleParcours(p.id)}
                              disabled={isExisting}
                            />
                            <span className="text-sm">{p.title}</span>
                            {isExisting && (
                              <span className="text-xs text-muted-foreground">(déjà assigné)</span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitExisting}
                    disabled={isLoading || selectedParcours.filter((id) => !existingUserParcours.includes(id)).length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ajout...
                      </>
                    ) : (
                      'Ajouter les parcours'
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}

            {!selectedUser && (
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            )}
          </div>
        )}

        {/* New user mode */}
        {mode === 'new' && !result && (
          <form onSubmit={handleSubmitNew} className="space-y-4">
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
        )}
      </DialogContent>
    </Dialog>
  )
}
