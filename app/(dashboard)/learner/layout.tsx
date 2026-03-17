import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/shared/DashboardShell'
import { OnboardingTour } from '@/components/learner/OnboardingTour'

export const metadata: Metadata = {
  title: 'Mes Formations',
}

const navItems = [
  { href: '/learner', label: 'Mes formations', icon: 'BookOpen' },
  { href: '/learner/quiz-history', label: 'Quiz', icon: 'ShieldCheck' },
  { href: '/learner/certificates', label: 'Certificats', icon: 'GraduationCap' },
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
      <OnboardingTour />
    </DashboardShell>
  )
}
