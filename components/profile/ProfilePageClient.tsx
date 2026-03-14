'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Mail,
  Shield,
  Moon,
  Sun,
  Save,
  Loader2,
  CheckCircle,
  PanelLeft,
  Monitor,
  AlertCircle,
} from 'lucide-react'

interface ProfilePageClientProps {
  userId: string
  userName: string
  userEmail: string
  userRole: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  TRAINER: 'Formateur',
  LEARNER: 'Apprenant',
}

const roleBadgeVariants: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  TRAINER: 'bg-blue-100 text-blue-700 border-blue-200',
  LEARNER: 'bg-green-100 text-green-700 border-green-200',
}

export function ProfilePageClient({ userName, userEmail, userRole }: ProfilePageClientProps) {
  const router = useRouter()
  const [name, setName] = useState(userName)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forma-cpv-theme') as 'light' | 'dark' || 'light'
    }
    return 'light'
  })
  const [layout, setLayout] = useState<'header' | 'sidebar'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('forma-cpv-layout') as 'header' | 'sidebar' || 'header'
    }
    return 'header'
  })

  const initials = (name || userEmail)
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleSaveName = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Erreur lors de la sauvegarde')
      }

      // Refresh server components to pick up new name from DB
      router.refresh()

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
    localStorage.setItem('forma-cpv-theme', newTheme)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez vos informations personnelles et préférences
        </p>
      </div>

      {/* Profile info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar size="lg" className={`w-16 h-16 text-xl ${roleBadgeVariants[userRole]}`}>
              <AvatarFallback className={`text-xl font-bold ${roleBadgeVariants[userRole]}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{name || userEmail}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {userEmail}
              </CardDescription>
              <Badge variant="outline" className={`mt-2 ${roleBadgeVariants[userRole]}`}>
                <Shield className="h-3 w-3 mr-1" />
                {roleLabels[userRole] || userRole}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Modifiez votre nom affiché sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nom</Label>
            <div className="flex gap-2">
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="max-w-sm"
              />
              <Button
                onClick={handleSaveName}
                disabled={isSaving || !name.trim() || name === userName}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saved ? 'Sauvegardé' : 'Sauvegarder'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userEmail} disabled className="max-w-sm bg-muted" />
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas être modifié
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card id="preferences">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Préférences
          </CardTitle>
          <CardDescription>
            Personnalisez votre expérience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm font-medium">Thème</p>
              <p className="text-xs text-muted-foreground">
                {theme === 'light' ? 'Mode clair activé' : 'Mode sombre activé'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  Mode sombre
                </>
              ) : (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  Mode clair
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between max-w-sm">
            <div>
              <p className="text-sm font-medium">Navigation</p>
              <p className="text-xs text-muted-foreground">
                {layout === 'header' ? 'Barre horizontale' : 'Barre latérale'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newLayout = layout === 'header' ? 'sidebar' : 'header'
                setLayout(newLayout)
                localStorage.setItem('forma-cpv-layout', newLayout)
                window.dispatchEvent(new CustomEvent('layout-change', { detail: newLayout }))
              }}
            >
              {layout === 'header' ? (
                <>
                  <PanelLeft className="mr-2 h-4 w-4" />
                  Sidebar
                </>
              ) : (
                <>
                  <Monitor className="mr-2 h-4 w-4" />
                  Header
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Le changement s&apos;applique instantanément.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card id="notifications">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Gérez vos préférences de notification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous recevez automatiquement un email lorsqu&apos;un formateur vous assigne une nouvelle formation.
          </p>
        </CardContent>
      </Card>

      {/* Help */}
      <Card id="help">
        <CardHeader>
          <CardTitle>Aide / Support</CardTitle>
          <CardDescription>
            Besoin d&apos;aide ?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contactez votre formateur ou administrateur pour toute question relative à vos formations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
