import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'

export const metadata: Metadata = {
  title: 'Aide - FormaCPV',
}

const navItems = [
  { href: '/help', label: 'Guide', icon: 'BookOpen' },
]

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

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
