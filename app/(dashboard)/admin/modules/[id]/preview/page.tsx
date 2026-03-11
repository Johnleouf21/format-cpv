import { ModulePreviewClient } from '@/components/admin/ModulePreviewClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ModulePreviewPage({ params }: PageProps) {
  const { id } = await params
  return <ModulePreviewClient moduleId={id} />
}
