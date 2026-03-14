import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'
import { MobileNav } from '@/components/shared/MobileNav'

const navItems = [
  { href: '/trainer', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/trainer/parcours', label: 'Parcours', icon: 'Route' },
  { href: '/trainer/learners', label: 'Mes apprenants', icon: 'Users' },
]

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
    redirect('/learner')
  }

  const roleLabel = session.user.role === 'ADMIN' ? 'Admin' : 'Formateur'
  const roleBadgeClass = session.user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'

  return (
    <DashboardShell
      navItems={navItems}
      mobileNavComponent={
        <MobileNav
          items={navItems}
          userName={session.user.name || ''}
          roleLabel={roleLabel}
          roleBadgeClass={roleBadgeClass}
        />
      }
      userName={session.user.name || session.user.email || ''}
      userEmail={session.user.email || ''}
      userRole={session.user.role}
      currentSpace="trainer"
    >
      {children}
    </DashboardShell>
  )
}
