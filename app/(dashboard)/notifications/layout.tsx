import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'

export const metadata: Metadata = {
  title: 'Notifications - FormaCPV',
}

const navItems = [
  { href: '/notifications', label: 'Notifications', icon: 'Activity' },
]

export default async function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const currentSpace = session.user.role === 'ADMIN' ? 'admin' : session.user.role === 'TRAINER' ? 'trainer' : 'learner'

  return (
    <DashboardShell
      navItems={navItems}
      userName={session.user.name || session.user.email || ''}
      userEmail={session.user.email || ''}
      userRole={session.user.role}
      currentSpace={currentSpace as 'admin' | 'trainer' | 'learner'}
      maxWidth="max-w-4xl"
    >
      {children}
    </DashboardShell>
  )
}
