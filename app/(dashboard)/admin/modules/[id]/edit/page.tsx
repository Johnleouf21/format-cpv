import { EditModulePageClient } from '@/components/admin/EditModulePageClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditModulePage({ params }: PageProps) {
  const { id } = await params
  return <EditModulePageClient moduleId={id} />
}
