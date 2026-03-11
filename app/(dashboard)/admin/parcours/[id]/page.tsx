import { ParcoursDetailClient } from '@/components/admin/ParcoursDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ParcoursDetailPage({ params }: PageProps) {
  const { id } = await params
  return <ParcoursDetailClient parcoursId={id} />
}
