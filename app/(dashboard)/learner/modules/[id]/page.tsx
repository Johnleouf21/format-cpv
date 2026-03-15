import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getModuleById } from '@/lib/services/module.service'
import { ModulePageClient } from '@/components/learner/ModulePageClient'

interface ModulePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function ModulePage({ params, searchParams }: ModulePageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const { quiz } = await searchParams

  try {
    const data = await getModuleById(id, session.user.id)

    return <ModulePageClient data={data} initialQuizReview={quiz === 'review'} />
  } catch {
    notFound()
  }
}
