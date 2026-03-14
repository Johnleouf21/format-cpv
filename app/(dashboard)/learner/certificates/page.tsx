import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CertificateDownloadButton } from '@/components/learner/CertificateDownloadButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, BookOpen, Calendar } from 'lucide-react'

export default async function CertificatesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Get all parcours where user completed every module
  const assignments = await prisma.userParcours.findMany({
    where: { userId: session.user.id },
    include: {
      parcours: {
        include: {
          modules: { select: { id: true } },
        },
      },
    },
    orderBy: { assignedAt: 'asc' },
  })

  const completedModuleIds = await prisma.progress.findMany({
    where: { userId: session.user.id },
    select: { moduleId: true, completedAt: true },
  })

  const completedSet = new Set(completedModuleIds.map((p) => p.moduleId))

  // Find parcours where all modules are completed
  const completedParcours = assignments
    .filter((a) => {
      const moduleIds = a.parcours.modules.map((m) => m.id)
      return moduleIds.length > 0 && moduleIds.every((id) => completedSet.has(id))
    })
    .map((a) => {
      // Find latest completion date for this parcours
      const moduleIds = new Set(a.parcours.modules.map((m) => m.id))
      const dates = completedModuleIds
        .filter((p) => moduleIds.has(p.moduleId))
        .map((p) => p.completedAt)
      const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null

      return {
        id: a.parcours.id,
        title: a.parcours.title,
        moduleCount: a.parcours.modules.length,
        completedAt: latestDate,
      }
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mes certificats</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {completedParcours.length > 0
            ? `${completedParcours.length} certificat${completedParcours.length !== 1 ? 's' : ''} obtenu${completedParcours.length !== 1 ? 's' : ''}`
            : 'Complétez un parcours pour obtenir votre premier certificat'}
        </p>
      </div>

      {completedParcours.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4">
                <Award className="h-7 w-7 text-amber-600" />
              </div>
              <p className="text-muted-foreground max-w-sm">
                Vous n&apos;avez pas encore de certificat. Terminez tous les modules d&apos;un parcours pour obtenir votre certificat de réussite.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {completedParcours.map((parcours) => (
            <Card key={parcours.id} className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{parcours.title}</CardTitle>
                    <CardDescription className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {parcours.moduleCount} modules
                      </span>
                      {parcours.completedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {parcours.completedAt.toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-600 shrink-0">Obtenu</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CertificateDownloadButton parcoursId={parcours.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
