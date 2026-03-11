import { TrainerParcoursDetailClient } from '@/components/trainer/TrainerParcoursDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TrainerParcoursDetailPage({ params }: PageProps) {
  const { id } = await params
  return <TrainerParcoursDetailClient parcoursId={id} />
}
