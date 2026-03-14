import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'

const navItems = [
  { href: '/learner', label: 'Mes formations', icon: 'BookOpen' },
]

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const allowedRoles = ['LEARNER', 'TRAINER', 'ADMIN']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }

  return (
    <DashboardShell
      navItems={navItems}
      userName={session.user.name || session.user.email || ''}
      userEmail={session.user.email || ''}
      userRole={session.user.role}
      currentSpace="learner"
      maxWidth="max-w-4xl"
    >
      {children}
    </DashboardShell>
  )
}
