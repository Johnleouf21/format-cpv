'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Mail } from 'lucide-react'

export function LoginButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [showTestLogin, setShowTestLogin] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testRole, setTestRole] = useState('ADMIN')

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 1. Create pending login for cross-device polling
      const pendingRes = await fetch('/api/auth/pending-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!pendingRes.ok) {
        const data = await pendingRes.json()
        if (pendingRes.status === 403) {
          setError('Adresse email non autorisée. Contactez votre administrateur.')
        } else {
          setError(data.error || 'Erreur lors de la connexion')
        }
        setIsLoading(false)
        return
      }

      const { id: pendingId } = await pendingRes.json()

      // 2. Request magic link with callbackUrl pointing to complete-login
      const result = await signIn('resend', {
        email,
        callbackUrl: `/api/auth/complete-login?pendingId=${pendingId}`,
        redirect: false,
      })

      if (result?.error) {
        setError('Erreur lors de l\'envoi du lien. Réessayez.')
        setIsLoading(false)
        return
      }

      // 3. Redirect to verify page with pendingId for polling
      router.push(`/login/verify?pendingId=${pendingId}`)
    } catch (err) {
      console.error('Sign in error:', err)
      setError('Erreur inattendue. Réessayez.')
      setIsLoading(false)
    }
  }

  const handleTestSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signIn('credentials', {
        email: testEmail,
        role: testRole,
        callbackUrl: testRole === 'ADMIN' ? '/admin' : testRole === 'TRAINER' ? '/trainer' : '/dashboard',
      })
    } catch (err) {
      console.error('Sign in error:', err)
      setIsLoading(false)
    }
  }

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="space-y-4">
      <form onSubmit={handleMagicLinkSignIn} className="space-y-3">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="magic-email">Adresse email</Label>
          <Input
            id="magic-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@entreprise.com"
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Envoi en cours...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Recevoir un lien de connexion
            </span>
          )}
        </Button>
      </form>

      {isDev && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Mode développement
              </span>
            </div>
          </div>

          {!showTestLogin ? (
            <Button
              variant="outline"
              onClick={() => setShowTestLogin(true)}
              className="w-full"
            >
              Connexion test (dev)
            </Button>
          ) : (
            <form onSubmit={handleTestSignIn} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test-email">Email</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@test.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-role">Rôle</Label>
                <select
                  id="test-role"
                  value={testRole}
                  onChange={(e) => setTestRole(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="ADMIN">Administrateur</option>
                  <option value="TRAINER">Formateur</option>
                  <option value="LEARNER">Apprenant</option>
                </select>
              </div>
              <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
                Se connecter (test)
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
