'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Plus, Trash2, Globe, Mail, AlertCircle } from 'lucide-react'

interface AllowedDomain {
  id: string
  domain: string
  createdAt: string
}

interface AllowedEmail {
  id: string
  email: string
  role: string
  createdAt: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  TRAINER: 'Formateur',
  LEARNER: 'Apprenant',
}

export function WhitelistPageClient() {
  const [domains, setDomains] = useState<AllowedDomain[]>([])
  const [emails, setEmails] = useState<AllowedEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newEmailRole, setNewEmailRole] = useState('LEARNER')
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [domainsRes, emailsRes] = await Promise.all([
        fetch('/api/admin/whitelist/domains'),
        fetch('/api/admin/whitelist/emails'),
      ])

      if (domainsRes.ok) setDomains(await domainsRes.json())
      if (emailsRes.ok) setEmails(await emailsRes.json())
    } catch (err) {
      console.error('Error fetching whitelist data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/admin/whitelist/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newDomain }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erreur lors de l\'ajout')
      return
    }

    const domain = await res.json()
    setDomains((prev) => [...prev, domain].sort((a, b) => a.domain.localeCompare(b.domain)))
    setNewDomain('')
    setIsDomainDialogOpen(false)
  }

  async function handleRemoveDomain(id: string) {
    const res = await fetch(`/api/admin/whitelist/domains/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDomains((prev) => prev.filter((d) => d.id !== id))
    }
  }

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/admin/whitelist/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, role: newEmailRole }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erreur lors de l\'ajout')
      return
    }

    const email = await res.json()
    setEmails((prev) => [...prev, email].sort((a, b) => a.email.localeCompare(b.email)))
    setNewEmail('')
    setNewEmailRole('LEARNER')
    setIsEmailDialogOpen(false)
  }

  async function handleUpdateEmailRole(id: string, role: string) {
    const res = await fetch(`/api/admin/whitelist/emails/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (res.ok) {
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, role } : e)))
    }
  }

  async function handleRemoveEmail(id: string) {
    const res = await fetch(`/api/admin/whitelist/emails/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEmails((prev) => prev.filter((e) => e.id !== id))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-6 w-44 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <Skeleton className="h-6 w-56 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-8 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accès</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez les domaines et emails autorisés à se connecter
        </p>
        <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md mt-2 inline-block">
          Les utilisateurs ajoutés via la gestion des apprenants sont automatiquement autorisés.
        </p>
      </div>

      {/* Domains Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50">
                <Globe className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              Domaines autorisés
            </CardTitle>
            <CardDescription>
              Tous les emails de ces domaines peuvent se connecter (rôle Apprenant par défaut)
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => { setError(''); setIsDomainDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun domaine autorisé
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domaine</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-mono">@{domain.domain}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(domain.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDomain(domain.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Emails Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50">
                <Mail className="h-4.5 w-4.5 text-blue-600" />
              </div>
              Emails individuels autorisés
            </CardTitle>
            <CardDescription>
              Emails spécifiques avec rôle assigné (prioritaire sur le domaine)
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => { setError(''); setIsEmailDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun email individuel autorisé
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-mono">{email.email}</TableCell>
                    <TableCell>
                      <Select value={email.role} onValueChange={(value) => handleUpdateEmailRole(email.id, value)}>
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrateur</SelectItem>
                          <SelectItem value="TRAINER">Formateur</SelectItem>
                          <SelectItem value="LEARNER">Apprenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(email.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEmail(email.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Domain Dialog */}
      <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un domaine autorisé</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDomain}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="domain">Domaine</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="entreprise.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Tous les emails @domaine pourront se connecter avec le rôle Apprenant
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDomainDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un email autorisé</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmail}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="utilisateur@exemple.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select value={newEmailRole} onValueChange={setNewEmailRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                    <SelectItem value="TRAINER">Formateur</SelectItem>
                    <SelectItem value="LEARNER">Apprenant</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le rôle sera attribué lors de la première connexion
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
