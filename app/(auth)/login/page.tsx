import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LoginButton } from '@/components/auth/LoginButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const params = await searchParams

  if (session?.user) {
    const redirectUrl = getRedirectUrl(session.user.role)
    redirect(redirectUrl)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">FormaCPV</CardTitle>
          <CardDescription>
            Plateforme de formation et d&apos;onboarding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {getErrorMessage(params.error)}
            </div>
          )}
          <LoginButton />
          <p className="text-xs text-center text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de connexion
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function getRedirectUrl(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'TRAINER':
      return '/trainer'
    case 'LEARNER':
    default:
      return '/dashboard'
  }
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'Configuration':
      return 'Erreur de configuration du serveur. Contactez l\'administrateur.'
    case 'AccessDenied':
      return 'Adresse email non autorisée. Contactez votre administrateur.'
    case 'Verification':
      return 'Le lien de vérification a expiré ou est invalide.'
    default:
      return 'Une erreur est survenue lors de la connexion. Veuillez réessayer.'
  }
}
