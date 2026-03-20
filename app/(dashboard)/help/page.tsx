import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { HelpPageClient } from './HelpPageClient'

export default async function HelpPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <HelpPageClient userRole={session.user.role} userName={session.user.name || ''} />
}
