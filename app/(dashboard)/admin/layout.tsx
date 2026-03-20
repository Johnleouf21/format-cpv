import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'
import { MobileNav } from '@/components/shared/MobileNav'

export const metadata: Metadata = {
  title: 'Administration',
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/modules', label: 'Modules', icon: 'BookOpen' },
  { href: '/admin/parcours', label: 'Parcours', icon: 'Route' },
  { href: '/admin/trainers', label: 'Formateurs', icon: 'GraduationCap' },
  { href: '/admin/centers', label: 'Centres', icon: 'Building2' },
  { href: '/admin/learners', label: 'Apprenants', icon: 'Users' },
  { href: '/admin/whitelist', label: 'Accès', icon: 'ShieldCheck' },
  { href: '/admin/feedback', label: 'Avis', icon: 'MessageSquare' },
  { href: '/admin/activity', label: 'Journal', icon: 'Activity' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/learner')
  }

  return (
    <DashboardShell
      navItems={navItems}
      mobileNavComponent={
        <MobileNav
          items={navItems}
          userName={session.user.name || ''}
          roleLabel="Admin"
          roleBadgeClass="bg-red-100 text-red-800"
        />
      }
      userName={session.user.name || session.user.email || ''}
      userEmail={session.user.email || ''}
      userRole={session.user.role}
      currentSpace="admin"
    >
      {children}
    </DashboardShell>
  )
}
