'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Building2, Loader2, MapPin, Plus, Trash2, Users, Pencil, ChevronRight } from 'lucide-react'

interface Center {
  id: string
  name: string
  region: string | null
  parentId: string | null
  parent: { id: string; name: string } | null
  children: { id: string; name: string; _count: { userCenters: number } }[]
  _count: { userCenters: number; children: number }
}

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCenter, setEditingCenter] = useState<Center | null>(null)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [parentId, setParentId] = useState<string>('none')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function fetchCenters() {
    try {
      const res = await fetch('/api/admin/centers')
      if (res.ok) setCenters(await res.json())
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [])

  // Centres parents (sans parent) pour le select
  const parentCenters = centers.filter((c) => !c.parentId)

  // Organiser : parents d'abord, puis enfants groupés
  const organizedCenters = parentCenters.map((parent) => ({
    ...parent,
    subCenters: centers.filter((c) => c.parentId === parent.id),
  }))
  // Centres orphelins (qui ont un parentId mais dont le parent n'est pas dans la liste)
  const orphans = centers.filter(
    (c) => c.parentId && !parentCenters.some((p) => p.id === c.parentId)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingCenter
        ? `/api/admin/centers/${editingCenter.id}`
        : '/api/admin/centers'
      const method = editingCenter ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          region: region || undefined,
          parentId: parentId !== 'none' ? parentId : null,
        }),
      })

      if (res.ok) {
        cancelForm()
        fetchCenters()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const res = await fetch(`/api/admin/centers/${deleteId}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      fetchCenters()
    }
  }

  function startEdit(center: Center) {
    setEditingCenter(center)
    setName(center.name)
    setRegion(center.region || '')
    setParentId(center.parentId || 'none')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingCenter(null)
    setName('')
    setRegion('')
    setParentId('none')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centres</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des sites et structures</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centres</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {parentCenters.length} structure{parentCenters.length !== 1 ? 's' : ''}, {centers.length} centre{centers.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingCenter ? 'Modifier le centre' : 'Nouveau centre'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Centre Paris Nord"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="region">Région (optionnel)</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Ex: Île-de-France"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Rattaché à (optionnel)</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune structure parente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune (structure principale)</SelectItem>
                      {parentCenters
                        .filter((c) => c.id !== editingCenter?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCenter ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste hiérarchique */}
      <div className="space-y-4">
        {organizedCenters.map((parent) => (
          <Card key={parent.id}>
            <CardContent className="pt-4 pb-4">
              {/* Centre parent */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{parent.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {parent.region && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {parent.region}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {parent._count.userCenters} apprenant{parent._count.userCenters !== 1 ? 's' : ''}
                      </span>
                      {parent._count.children > 0 && (
                        <span className="text-xs text-blue-600 font-medium">
                          {parent._count.children} sous-centre{parent._count.children !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(parent)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteId(parent.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Sous-centres */}
              {parent.subCenters.length > 0 && (
                <div className="mt-3 ml-6 pl-4 border-l-2 border-blue-100 space-y-2">
                  {parent.subCenters.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-sm font-medium">{sub.name}</span>
                        {sub.region && (
                          <span className="text-xs text-muted-foreground">({sub.region})</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          · {sub._count.userCenters} apprenant{sub._count.userCenters !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(sub)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(sub.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Centres orphelins (sans parent valide) */}
        {orphans.map((center) => (
          <Card key={center.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                    <Building2 className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{center.name}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" />
                      {center._count.userCenters} apprenant{center._count.userCenters !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(center)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteId(center.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {centers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Aucun centre créé</p>
              <p className="text-xs text-muted-foreground mt-1">
                Créez des structures (SELAS, groupes) puis ajoutez-y des sous-centres
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer le centre"
        description="Les sous-centres seront détachés et les apprenants rattachés seront aussi détachés (mais pas supprimés)."
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
