import { TrainerModuleViewClient } from '@/components/trainer/TrainerModuleViewClient'

interface PageProps {
  params: Promise<{ id: string; moduleId: string }>
}

export default async function TrainerModuleViewPage({ params }: PageProps) {
  const { id, moduleId } = await params
  return <TrainerModuleViewClient parcoursId={id} moduleId={moduleId} />
}
