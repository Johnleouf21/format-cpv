'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyRequestContent />
    </Suspense>
  )
}

function VerifyRequestContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pendingId = searchParams.get('pendingId')

  const [status, setStatus] = useState<'polling' | 'signing-in' | 'error' | 'expired'>('polling')
  const [errorMessage, setErrorMessage] = useState('')

  const pollAndSignIn = useCallback(async () => {
    if (!pendingId) return

    try {
      const res = await fetch(`/api/auth/poll-login?id=${pendingId}`)
      if (!res.ok) {
        if (res.status === 404) {
          setStatus('error')
          setErrorMessage('Lien de connexion invalide.')
        }
        return
      }

      const data = await res.json()

      if (data.expired) {
        setStatus('expired')
        return
      }

      if (data.verified) {
        setStatus('signing-in')

        const result = await signIn('credentials', {
          pendingLoginId: pendingId,
          redirect: false,
        })

        if (result?.error) {
          setStatus('error')
          setErrorMessage('Erreur lors de la connexion automatique.')
          return
        }

        // Fetch session to get the user's role for redirect
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
      }
    } catch {
      // Network error, will retry on next poll
    }
  }, [pendingId, router])

  useEffect(() => {
    if (!pendingId || status !== 'polling') return

    // Poll immediately, then every 3 seconds
    pollAndSignIn()
    const interval = setInterval(pollAndSignIn, 3000)

    return () => clearInterval(interval)
  }, [pendingId, status, pollAndSignIn])

  if (!pendingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Vérifiez votre email</CardTitle>
            <CardDescription>
              Un lien de connexion a été envoyé à votre adresse email.
              Cliquez sur le lien pour vous connecter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Le lien expire dans 15 minutes. Si vous ne recevez pas l&apos;email,
              vérifiez votre dossier spam.
            </p>
            <Button variant="outline" asChild>
              <Link href="/login">Retour à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'polling' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Vérifiez votre email</CardTitle>
              <CardDescription>
                Un lien de connexion a été envoyé à votre adresse email.
                Cliquez sur le lien depuis n&apos;importe quel appareil pour vous connecter ici.
              </CardDescription>
            </>
          )}

          {status === 'signing-in' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Connexion en cours...</CardTitle>
              <CardDescription>
                Le lien a été validé. Redirection automatique...
              </CardDescription>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Lien expiré</CardTitle>
              <CardDescription>
                Le lien de connexion a expiré. Veuillez en demander un nouveau.
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Erreur</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'polling' && (
            <>
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
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
                <span className="text-sm text-muted-foreground">En attente de validation...</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Le lien expire dans 15 minutes. Si vous ne recevez pas l&apos;email,
                vérifiez votre dossier spam.
              </p>
            </>
          )}
          {(status === 'expired' || status === 'error') && (
            <Button variant="outline" asChild>
              <Link href="/login">Retour à la connexion</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
