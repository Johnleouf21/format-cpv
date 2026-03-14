import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'
import { MobileNav } from '@/components/shared/MobileNav'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/modules', label: 'Modules', icon: 'BookOpen' },
  { href: '/admin/parcours', label: 'Parcours', icon: 'Route' },
  { href: '/admin/trainers', label: 'Formateurs', icon: 'GraduationCap' },
  { href: '/admin/learners', label: 'Apprenants', icon: 'Users' },
  { href: '/admin/whitelist', label: 'Accès', icon: 'ShieldCheck' },
]

const trainerNavItems = [
  { href: '/trainer', label: 'Mes parcours', icon: 'Route' },
]

const learnerNavItems = [
  { href: '/learner', label: 'Mes formations', icon: 'BookOpen' },
]

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const currentSpace =
    session.user.role === 'ADMIN'
      ? 'admin' as const
      : session.user.role === 'TRAINER'
        ? 'trainer' as const
        : 'learner' as const

  const navItems =
    currentSpace === 'admin'
      ? adminNavItems
      : currentSpace === 'trainer'
        ? trainerNavItems
        : learnerNavItems

  const roleLabel =
    currentSpace === 'admin' ? 'Admin' : currentSpace === 'trainer' ? 'Formateur' : 'Apprenant'

  const roleBadgeClass =
    currentSpace === 'admin'
      ? 'bg-red-100 text-red-800'
      : currentSpace === 'trainer'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-green-100 text-green-800'

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
      currentSpace={currentSpace}
    >
      {children}
    </DashboardShell>
  )
}
