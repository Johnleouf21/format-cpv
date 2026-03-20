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
  const [status, setStatus] = useState<'checking' | 'same-browser' | 'other-device'>('checking')

  useEffect(() => {
    if (!pendingId) {
      setStatus('other-device')
      return
    }

    async function checkAndLogin() {
      // Vérifier si le pendingLogin existe encore (pas encore consommé par le polling)
      try {
        const pollRes = await fetch(`/api/auth/poll-login?id=${pendingId}`)
        if (!pollRes.ok) {
          // Déjà consommé par l'onglet d'origine → autre appareil ou onglet déjà connecté
          setStatus('other-device')
          return
        }

        const data = await pollRes.json()
        if (!data.verified) {
          // Pas encore vérifié (ne devrait pas arriver ici mais au cas où)
          setStatus('other-device')
          return
        }

        // Le pendingLogin est vérifié et existe encore → même navigateur
        // On peut faire le signIn ici car le polling ne l'a pas encore consommé
        const result = await signIn('credentials', {
          pendingLoginId: pendingId,
          redirect: false,
        })

        if (result?.ok) {
          setStatus('same-browser')
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
        // Erreur réseau ou token invalide
      }

      setStatus('other-device')
    }

    // Petit délai pour laisser le temps au polling de l'onglet d'origine de consommer d'abord
    const timeout = setTimeout(checkAndLogin, 1500)
    return () => clearTimeout(timeout)
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
            {status === 'checking'
              ? 'Vérification en cours...'
              : status === 'same-browser'
                ? 'Redirection en cours...'
                : 'Votre connexion a été vérifiée avec succès.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'checking' ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              <span className="text-sm text-muted-foreground">Connexion automatique...</span>
            </div>
          ) : status === 'same-browser' ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              <span className="text-sm text-muted-foreground">Redirection...</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Retournez sur l&apos;onglet ou l&apos;appareil où vous avez demandé la connexion.
              Vous y serez connecté automatiquement.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
