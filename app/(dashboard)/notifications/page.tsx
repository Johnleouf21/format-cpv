import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NotificationsPageClient } from './NotificationsPageClient'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return <NotificationsPageClient />
}
