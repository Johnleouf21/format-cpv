import { LoginButton } from '@/components/auth/LoginButton'
import { AutoSignOut } from '@/components/auth/AutoSignOut'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2B4C7E] via-[#3A5F96] to-[#1E3A5F] px-4">
      {/* Auto sign out any existing session when landing on login page */}
      <AutoSignOut />
      <div className="w-full max-w-md space-y-6">
        {/* Logo & branding */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo-pointvision.png" alt="Point Vision" className="h-20 w-20 rounded-xl shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white">FormaCPV</h1>
          <p className="text-blue-200 mt-1">Plateforme de formation Point Vision</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de connexion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {params.error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-md">
                {getErrorMessage(params.error)}
              </div>
            )}
            <LoginButton />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-blue-300/70">
          L&apos;ophtalmologie de pointe &mdash; Groupe Point Vision
        </p>
      </div>
    </div>
  )
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
