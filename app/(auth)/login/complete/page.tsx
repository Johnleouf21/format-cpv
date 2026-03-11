import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function LoginCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Connexion validée !</CardTitle>
          <CardDescription>
            Votre connexion a été vérifiée avec succès.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous pouvez fermer cet onglet et retourner sur votre ordinateur.
            La page se mettra à jour automatiquement.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
