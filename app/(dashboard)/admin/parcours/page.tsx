import { Suspense } from 'react'
import { ParcoursPageClient } from '@/components/admin/ParcoursPageClient'

export default function AdminParcoursPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ParcoursPageClient />
    </Suspense>
  )
}
