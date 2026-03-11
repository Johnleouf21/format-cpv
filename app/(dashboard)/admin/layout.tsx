import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { SpaceSwitcher } from '@/components/shared/SpaceSwitcher'
import { MobileNav } from '@/components/shared/MobileNav'

const mobileNavItems = [
  { href: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/modules', label: 'Modules', icon: 'BookOpen' },
  { href: '/admin/parcours', label: 'Parcours', icon: 'Route' },
  { href: '/admin/trainers', label: 'Formateurs', icon: 'GraduationCap' },
  { href: '/admin/learners', label: 'Apprenants', icon: 'Users' },
  { href: '/admin/whitelist', label: 'Accès', icon: 'ShieldCheck' },
]

const navLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/modules', label: 'Modules' },
  { href: '/admin/parcours', label: 'Parcours' },
  { href: '/admin/trainers', label: 'Formateurs' },
  { href: '/admin/learners', label: 'Apprenants' },
  { href: '/admin/whitelist', label: 'Accès' },
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
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 min-w-0">
            <MobileNav
              items={mobileNavItems}
              userName={session.user.name || ''}
              roleLabel="Admin"
              roleBadgeClass="bg-red-100 text-red-800"
            />
            <Link href="/admin" className="text-lg font-bold text-primary shrink-0">
              FormaCPV
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <SpaceSwitcher currentSpace="admin" userRole={session.user.role} />
            <SignOutButton variant="ghost" size="icon" showIcon />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  )
}
