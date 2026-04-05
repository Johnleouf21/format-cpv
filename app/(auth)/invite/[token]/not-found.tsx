import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InviteNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2B4C7E] via-[#3A5F96] to-[#1E3A5F] px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-red-600">
            Invitation invalide
          </CardTitle>
          <CardDescription>
            Ce lien d&apos;invitation est invalide, a expiré ou a déjà été utilisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Contactez votre formateur pour obtenir un nouveau lien d&apos;invitation.
          </p>
          <Button asChild>
            <Link href="/login">Aller à la connexion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
