import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case 'ADMIN':
      redirect('/admin')
    case 'TRAINER':
      redirect('/trainer')
    case 'LEARNER':
    default:
      redirect('/learner')
  }
}
