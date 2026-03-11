import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { SpaceSwitcher } from '@/components/shared/SpaceSwitcher'

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
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/learner" className="text-lg font-bold text-primary shrink-0">
              FormaCPV
            </Link>
            <SpaceSwitcher currentSpace="learner" userRole={session.user.role} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                {(session.user.name || 'A').charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[100px]">
                {session.user.name}
              </span>
            </div>
            <SignOutButton variant="ghost" size="icon" showIcon />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
