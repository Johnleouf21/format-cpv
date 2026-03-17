import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getLearnerDetails } from '@/lib/services/trainer.service'
import { UserRole } from '@prisma/client'
import { LearnerDetailView } from '@/components/shared/LearnerDetailView'
import { PageBreadcrumb } from '@/components/shared/PageBreadcrumb'

interface AdminLearnerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminLearnerDetailPage({
  params,
}: AdminLearnerDetailPageProps) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const { id } = await params

  try {
    const data = await getLearnerDetails(session.user.id, id, UserRole.ADMIN)

    return (
      <div className="space-y-6">
        <PageBreadcrumb items={[
          { label: 'Apprenants', href: '/admin/learners' },
          { label: data.learner.name },
        ]} />
        <LearnerDetailView data={JSON.parse(JSON.stringify(data))} />
      </div>
    )
  } catch {
    notFound()
  }
}