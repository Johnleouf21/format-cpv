'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function LoginCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Connexion validée !</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginCompleteContent />
    </Suspense>
  )
}

function LoginCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pendingId = searchParams.get('pendingId')
  const [status, setStatus] = useState<'trying' | 'fallback'>('trying')

  useEffect(() => {
    if (!pendingId) {
      setStatus('fallback')
      return
    }

    async function tryAutoLogin() {
      try {
        const result = await signIn('credentials', {
          pendingLoginId: pendingId,
          redirect: false,
        })

        if (result?.ok) {
          // Connexion réussie sur ce navigateur, on redirige vers le dashboard
          const sessionRes = await fetch('/api/auth/session')
          const session = await sessionRes.json()
          const role = session?.user?.role

          if (role === 'ADMIN') {
            router.push('/admin')
          } else if (role === 'TRAINER') {
            router.push('/trainer')
          } else {
            router.push('/learner')
          }
          return
        }
      } catch {
        // Échec (autre appareil, token déjà consommé, etc.)
      }

      // Si on arrive ici, l'auto-login n'a pas marché (téléphone, autre navigateur)
      setStatus('fallback')
    }

    tryAutoLogin()
  }, [pendingId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Connexion validée !</CardTitle>
          <CardDescription>
            {status === 'trying'
              ? 'Redirection en cours...'
              : 'Votre connexion a été vérifiée avec succès.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'trying' ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              <span className="text-sm text-muted-foreground">Connexion automatique...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous pouvez fermer cet onglet et retourner sur l&apos;onglet d&apos;origine.
              La page se mettra à jour automatiquement.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}