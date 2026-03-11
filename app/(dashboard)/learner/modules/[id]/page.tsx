import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getModuleById } from '@/lib/services/module.service'
import { ModulePageClient } from '@/components/learner/ModulePageClient'

interface ModulePageProps {
  params: Promise<{ id: string }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params

  try {
    const data = await getModuleById(id, session.user.id)

    return <ModulePageClient data={data} />
  } catch {
    notFound()
  }
}
